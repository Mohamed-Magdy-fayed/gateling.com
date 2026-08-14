import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/general/link-button";
import { RelatedContentSection } from "@/components/general/related-content";
import {
  CardHeading,
  CheckItem,
  Container,
  ContentCard,
  Grid,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
} from "@/components/ui/containers";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import {
  resolveRelatedArticles,
  resolveRelatedCaseStudies,
} from "@/features/public-catalog/lib/related-content";
import { api } from "@/integrations/trpc/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";
import { ServiceIcon } from "../_service-icon";
import { serviceLinksFor } from "../_service-links";

type Props = { params: Promise<{ slug: string }> };

/** `fullDescription` is stored as plain text with blank-line paragraph breaks. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caller = await api();
  const service = await caller.servicesMgmt
    .publicGetBySlug({ slug })
    .catch(() => null);
  if (!service) return {};

  const url = canonicalUrl(`/services/${slug}`);
  const image =
    service.media?.find((m) => m.isFeatured)?.url ?? service.coverImageUrl;

  return {
    title: service.title,
    description: service.shortDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: service.title,
      description: service.shortDescription,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: service.title,
      description: service.shortDescription,
      ...(image ? { images: [image] } : {}),
    },
  };
}

async function ServiceDetailContent({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
  const locale = await getLocaleCookie();
  const caller = await api();

  const service = await caller.servicesMgmt
    .publicGetBySlug({ slug })
    .catch(() => null);

  if (!service) notFound();

  const links = serviceLinksFor(service.slug);
  const [allServices, caseStudies, articles] = await Promise.all([
    caller.servicesMgmt.publicList().catch(() => []),
    resolveRelatedCaseStudies(caller, links.caseStudies, `services/${slug}`),
    resolveRelatedArticles(caller, links.articles, locale, `services/${slug}`),
  ]);

  const otherServices = allServices
    .filter((other) => other.slug !== service.slug)
    .map((other) => ({
      href: `/services/${other.slug}`,
      title: other.title,
      description: other.shortDescription,
    }));

  const paragraphs = service.fullDescription
    ? toParagraphs(service.fullDescription)
    : [];
  const heroImage =
    service.media?.find((m) => m.isFeatured)?.url ?? service.coverImageUrl;
  const contactHref = `/contact?source=service-${service.slug}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    serviceType: service.title,
    url: canonicalUrl(`/services/${service.slug}`),
    provider: { "@id": "https://gateling.com/#org" },
    areaServed: "EG",
    ...(heroImage ? { image: heroImage } : {}),
    ...(service.features.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: service.title,
            itemListElement: service.features.map((feature) => ({
              "@type": "Offer",
              itemOffered: { "@type": "Service", name: feature },
            })),
          },
        }
      : {}),
  };

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Services", path: "/services" },
    { name: service.title, path: `/services/${service.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <HeroContainer>
        <Container size="narrow">
          <Link
            href="/services"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
            {t("publicPages.serviceDetailPage.backToServices")}
          </Link>

          <div className="mt-6 space-y-4">
            <ServiceIcon name={service.icon} />
            <PageHeading className="leading-tight">{service.title}</PageHeading>
            <ProseText size="lg">{service.shortDescription}</ProseText>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={contactHref} size="lg">
              {t("publicPages.serviceDetailPage.heroPrimary")}
            </LinkButton>
            <LinkButton href="/work" variant="outline" size="lg">
              {t("publicPages.serviceDetailPage.heroSecondary")}
            </LinkButton>
          </div>
        </Container>
      </HeroContainer>

      {(paragraphs.length > 0 || heroImage) && (
        <Section variant="feature">
          <Container size="wide">
            <div
              className={
                heroImage ? "grid gap-10 lg:grid-cols-[1.6fr,1fr]" : undefined
              }
            >
              <div>
                <SectionHeader
                  heading={t("publicPages.serviceDetailPage.overviewHeading")}
                  align="start"
                  className="mb-6"
                />
                {paragraphs.length > 0 ? (
                  <div className="space-y-4">
                    {paragraphs.map((paragraph) => (
                      <ProseText key={paragraph.slice(0, 48)}>
                        {paragraph}
                      </ProseText>
                    ))}
                  </div>
                ) : (
                  <ProseText>{service.shortDescription}</ProseText>
                )}
              </div>

              {heroImage && (
                <div className="border-border/60 bg-muted/40 self-start overflow-hidden rounded-2xl border shadow-sm">
                  <Image
                    src={heroImage}
                    alt={service.title}
                    width={960}
                    height={540}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {service.features.length > 0 && (
        <Section variant="alternate">
          <Container>
            <SectionHeader
              heading={t("publicPages.serviceDetailPage.includedHeading")}
              subheading={t("publicPages.serviceDetailPage.includedSubheading")}
            />
            <Grid cols={2}>
              {service.features.map((feature) => (
                <ContentCard key={feature}>
                  <CheckItem>{feature}</CheckItem>
                </ContentCard>
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      <RelatedContentSection
        variant="feature"
        eyebrow={t("publicPages.serviceDetailPage.proofEyebrow")}
        heading={t("publicPages.serviceDetailPage.proofHeading")}
        subheading={t("publicPages.serviceDetailPage.proofSubheading")}
        items={caseStudies}
        linkLabel={t("publicPages.relatedContent.readCaseStudy")}
        columns={3}
      />

      <RelatedContentSection
        variant="alternate"
        eyebrow={t("publicPages.serviceDetailPage.articlesEyebrow")}
        heading={t("publicPages.serviceDetailPage.articlesHeading")}
        subheading={t("publicPages.serviceDetailPage.articlesSubheading")}
        items={articles}
        linkLabel={t("publicPages.relatedContent.readArticle")}
      />

      {otherServices.length > 0 && (
        <Section variant="feature">
          <Container>
            <SectionHeader
              heading={t("publicPages.serviceDetailPage.otherServicesHeading")}
              subheading={t(
                "publicPages.serviceDetailPage.otherServicesSubheading",
              )}
            />
            <Grid cols={3}>
              {otherServices.map((other) => (
                <Link key={other.href} href={other.href} className="group">
                  <ContentCard className="flex h-full flex-col">
                    <CardHeading className="group-hover:text-primary transition-colors">
                      {other.title}
                    </CardHeading>
                    <ProseText size="sm" className="mt-3">
                      {other.description}
                    </ProseText>
                  </ContentCard>
                </Link>
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.serviceDetailPage.ctaHeading")}
            subheading={t("publicPages.serviceDetailPage.ctaSubheading")}
          />
          <LinkButton href={contactHref} size="lg">
            {t("publicPages.serviceDetailPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}

export default async function ServiceDetailPage({ params }: Props) {
  return <ServiceDetailContent params={params} />;
}
