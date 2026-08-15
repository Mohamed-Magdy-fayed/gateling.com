import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  QuoteIcon,
  StarIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { LinkButton } from "@/components/general/link-button";
import { MediaSection } from "@/components/general/media-section";
import { Badge } from "@/components/ui/badge";
import {
  Container,
  ContentCard,
  Grid,
  HeroContainer,
  PageHeading,
  ProseText,
  Section,
  SectionHeader,
  StatCard,
} from "@/components/ui/containers";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";
import {
  buildMetadata,
  clampHeadline,
  featuredImage,
  ORG_REF,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caller = await api();
  const cs = await caller.caseStudies
    .publicGetBySlug({ slug })
    .catch(() => null);
  if (!cs) return {};
  return buildMetadata({
    // `cs.title` already leads with the client, per the case-study headline
    // pattern in `docs/seo-blueprint.md` ("Atelier Alaa El-Kasry: 70% Less
    // Admin Time"). Appending `cs.client` produced the name twice.
    title: cs.title,
    description: cs.results.summary || cs.problemStatement.slice(0, 155),
    path: `/work/${slug}`,
    image: featuredImage(cs.media, cs.coverImageUrl),
    type: "article",
    publishedTime: cs.publishedAt?.toISOString(),
    modifiedTime: cs.updatedAt?.toISOString(),
  });
}

async function WorkDetailContent({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
  const locale = await getLocaleCookie();
  const caller = await api();
  const cs = await caller.caseStudies
    .publicGetBySlug({ slug })
    .catch(() => null);

  if (!cs) notFound();

  const testimonials = await caller.testimonials
    .publicListByCaseStudy({ caseStudyId: cs.id })
    .catch(() => []);

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
    return (
      (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
    ).toUpperCase();
  }

  const url = canonicalUrl(`/work/${cs.slug}`);
  const caseStudyImage = featuredImage(cs.media, cs.coverImageUrl);

  // `Article`, not `CreativeWork`: a case study is editorial content about a
  // project, and only `Article` is eligible for Google's article treatment.
  // `CreativeWork` is too abstract to earn any rich result.
  //
  // The testimonials that used to hang off this node as `review[]` are gone.
  // They are reviews of Gateling, not of this article, and self-serving review
  // markup about your own organization is against Google's review-snippet
  // policy. They still render on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: clampHeadline(cs.title),
    name: cs.title,
    about: cs.industry,
    description: cs.results.summary || cs.problemStatement,
    ...(caseStudyImage ? { image: caseStudyImage } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: locale === "ar" ? "ar" : "en",
    author: ORG_REF,
    publisher: ORG_REF,
    ...(cs.publishedAt
      ? { datePublished: cs.publishedAt.toISOString() }
      : {}),
    ...(cs.updatedAt ? { dateModified: cs.updatedAt.toISOString() } : {}),
  };

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Work", path: "/work" },
    { name: cs.title, path: `/work/${cs.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* Hero: title, client, badge */}
      <HeroContainer imageUrl={cs.coverImageUrl ?? undefined}>
        <Container size="narrow">
          <Link
            href="/work"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
            {t("publicPages.workDetailPage.backToWork")}
          </Link>

          <div className="mt-6 space-y-4">
            <Badge variant="secondary">{cs.industry}</Badge>
            <PageHeading className="leading-tight">{cs.title}</PageHeading>
            <ProseText size="lg">{cs.client}</ProseText>
            {cs.liveUrl && (
              <a
                href={cs.liveUrl}
                target="_blank"
                // `nofollow`: these point at client apps on *.gateling.com,
                // which are separate deployments that currently outrank this
                // site. See the client-subdomain decision in docs/seo-program.md.
                rel="noopener noreferrer nofollow"
                className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                {t("publicPages.workDetailPage.viewLiveApp")}
              </a>
            )}
          </div>
        </Container>
      </HeroContainer>

      {/* Challenge + Solution alongside sticky cover image */}
      <Section variant="feature">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[1.7fr,1fr]">
            {/* Left: narrative content */}
            <div className="space-y-10">
              {cs.blocks && cs.blocks.length > 0 ? (
                <BlockRenderer
                  blocks={cs.blocks}
                  locale={locale === "ar" ? "ar" : "en"}
                />
              ) : (
                // legacy fallback, remove once all case studies are migrated to blocks
                <>
                  <div>
                    <h2 className="mb-4 text-2xl font-bold">
                      {t("publicPages.workDetailPage.challengeHeading")}
                    </h2>
                    <ProseText>{cs.problemStatement}</ProseText>
                  </div>

                  <div>
                    <h2 className="mb-4 text-2xl font-bold">
                      {t("publicPages.workDetailPage.solutionHeading")}
                    </h2>
                    <ProseText>{cs.solution}</ProseText>
                  </div>
                </>
              )}
            </div>

            {/* Right: media section or fallback cover image */}
            <div className="sticky top-24 self-start">
              {cs.media && cs.media.length > 0 ? (
                <MediaSection items={cs.media} />
              ) : cs.coverImageUrl ? (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
                  <Image
                    src={cs.coverImageUrl}
                    alt={cs.title}
                    width={960}
                    height={540}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* Results */}
      <Section variant="alternate">
        <Container>
          <SectionHeader
            heading={t("publicPages.workDetailPage.resultsHeading")}
            align="start"
          />

          {cs.results.metrics.length > 0 && (
            <Grid cols={3} gap="compact">
              {cs.results.metrics.map((metric) => (
                <StatCard
                  key={metric.label}
                  value={metric.value}
                  label={metric.label}
                  className="bg-primary/5 text-center"
                />
              ))}
            </Grid>
          )}

          {cs.results.summary && (
            <ProseText className="mt-6">{cs.results.summary}</ProseText>
          )}
        </Container>
      </Section>

      {/* Secondary media — shown naturally between results and testimonials */}
      {(() => {
        const secondary = cs.media?.find((m) => m.isSecondary);
        if (!secondary) return null;
        return (
          <Section variant="feature">
            <Container>
              <MediaSection items={[secondary]} />
            </Container>
          </Section>
        );
      })()}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section
          variant={
            cs.media?.find((m) => m.isSecondary) ? "alternate" : "feature"
          }
        >
          <Container>
            <SectionHeader
              heading={t("publicPages.workDetailPage.testimonialHeading")}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t2) => (
                <ContentCard
                  key={t2.id}
                  className="relative flex flex-col hover:ring-0"
                >
                  <div className="bg-primary text-primary-foreground absolute -top-3 inset-s-5 flex h-6 w-6 items-center justify-center rounded-full">
                    <QuoteIcon className="h-3 w-3" />
                  </div>
                  {t2.rating && (
                    <div className="mb-3 flex gap-0.5 pt-2">
                      {[1, 2, 3, 4, 5].slice(0, t2.rating).map((star) => (
                        <StarIcon
                          key={star}
                          className="fill-primary text-primary h-4 w-4"
                        />
                      ))}
                    </div>
                  )}
                  <ProseText size="sm" className="mb-6 flex-1 italic">
                    &ldquo;{t2.content}&rdquo;
                  </ProseText>
                  <div className="flex items-center gap-3">
                    {t2.avatarUrl ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={t2.avatarUrl}
                          alt={t2.clientName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        <span className="text-primary text-sm font-semibold">
                          {getInitials(t2.clientName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{t2.clientName}</p>
                      <p className="text-muted-foreground text-xs">
                        {t2.role ? `${t2.role}, ` : ""}
                        {t2.company}
                      </p>
                    </div>
                  </div>
                </ContentCard>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.workDetailPage.ctaDescription")}
            className="mb-6"
          />
          <LinkButton href="/contact" size="lg">
            {t("publicPages.workDetailPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}

export default async function WorkDetailPage({ params }: Props) {
  return <WorkDetailContent params={params} />;
}
