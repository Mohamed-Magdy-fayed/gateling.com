import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  StatCard,
} from "@/components/ui/containers";
import { getLocaleCookie, getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";
import { cn } from "@/lib/utils";

const CASE_STUDY_SLUG = "ba2olak";
const ARTICLE_A_SLUG = "delivery-app-for-underserved-towns-egypt";
const ARTICLE_B_SLUG = "ba2olak-delivery-marketplace-case-study";
const LEAD_SOURCE = "solutions-delivery";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("publicPages.solutionsDeliveryPage.metaTitle"),
    description: t("publicPages.solutionsDeliveryPage.metaDescription"),
    alternates: { canonical: canonicalUrl("/solutions/delivery") },
  };
}

async function SolutionsDeliveryContent() {
  const { t } = await getT();
  const locale = await getLocaleCookie();
  const caller = await api();

  const [caseStudy, articleA, articleB] = await Promise.all([
    caller.caseStudies
      .publicGetBySlug({ slug: CASE_STUDY_SLUG })
      .catch(() => null),
    caller.blogPosts
      .publicGetBySlug({ slug: ARTICLE_A_SLUG })
      .catch(() => null),
    caller.blogPosts
      .publicGetBySlug({ slug: ARTICLE_B_SLUG })
      .catch(() => null),
  ]);

  // This page's proof and article sections render only when their rows resolve.
  // That is deliberate — a pillar page must never link a slug that 404s — but it
  // also means a missing or unpublished row silently removes ~40% of the page.
  // Surface it in the server log instead of letting it pass unnoticed.
  for (const [slug, row] of [
    [CASE_STUDY_SLUG, caseStudy],
    [ARTICLE_A_SLUG, articleA],
    [ARTICLE_B_SLUG, articleB],
  ] as const) {
    if (row == null) {
      console.warn(
        `[solutions/delivery] "${slug}" did not resolve — it is missing, ` +
          `soft-deleted, or still a draft. Its section will not render.`,
      );
    }
  }

  const articles = [articleA, articleB]
    .filter((post) => post != null)
    .map((post) => ({
      slug: post.slug,
      title: locale === "ar" ? (post.titleAr ?? post.title) : post.title,
      excerpt:
        locale === "ar" ? (post.excerptAr ?? post.excerpt) : post.excerpt,
    }));

  const faqItems = [
    {
      q: t("publicPages.solutionsDeliveryPage.faq1Q"),
      a: t("publicPages.solutionsDeliveryPage.faq1A"),
    },
    {
      q: t("publicPages.solutionsDeliveryPage.faq2Q"),
      a: t("publicPages.solutionsDeliveryPage.faq2A"),
    },
    {
      q: t("publicPages.solutionsDeliveryPage.faq3Q"),
      a: t("publicPages.solutionsDeliveryPage.faq3A"),
    },
    {
      q: t("publicPages.solutionsDeliveryPage.faq4Q"),
      a: t("publicPages.solutionsDeliveryPage.faq4A"),
    },
  ];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Delivery App Development for Underserved Areas",
    description: t("publicPages.solutionsDeliveryPage.metaDescription"),
    provider: { "@id": "https://gateling.com/#org" },
    areaServed: "EG",
    url: canonicalUrl("/solutions/delivery"),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Delivery App Solutions", path: "/solutions/delivery" },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <HeroContainer>
        <Container size="narrow" className="text-center">
          <PageHeading>
            {t("publicPages.solutionsDeliveryPage.heading")}
          </PageHeading>
          <ProseText size="lg" className="mx-auto mt-4 max-w-2xl">
            {t("publicPages.solutionsDeliveryPage.subheading")}
          </ProseText>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href={`/contact?source=${LEAD_SOURCE}`} size="lg">
              {t("publicPages.solutionsDeliveryPage.heroPrimary")}
            </LinkButton>
            <LinkButton
              href={`/work/${CASE_STUDY_SLUG}`}
              variant="outline"
              size="lg"
            >
              {t("publicPages.solutionsDeliveryPage.heroSecondary")}
            </LinkButton>
          </div>
        </Container>
      </HeroContainer>

      {/* Problem */}
      <Section variant="alternate">
        <Container>
          <SectionHeader
            eyebrow={t("publicPages.solutionsDeliveryPage.problemEyebrow")}
            heading={t("publicPages.solutionsDeliveryPage.problemHeading")}
            subheading={t(
              "publicPages.solutionsDeliveryPage.problemSubheading",
            )}
          />
          <ContentCard className="mx-auto max-w-2xl space-y-3">
            <CheckItem>
              {t("publicPages.solutionsDeliveryPage.problemItem1")}
            </CheckItem>
            <CheckItem>
              {t("publicPages.solutionsDeliveryPage.problemItem2")}
            </CheckItem>
            <CheckItem>
              {t("publicPages.solutionsDeliveryPage.problemItem3")}
            </CheckItem>
            <CheckItem>
              {t("publicPages.solutionsDeliveryPage.problemItem4")}
            </CheckItem>
            <CheckItem>
              {t("publicPages.solutionsDeliveryPage.problemItem5")}
            </CheckItem>
          </ContentCard>
        </Container>
      </Section>

      {/* Proof: case study embed */}
      {caseStudy && (
        <Section variant="feature">
          <Container size="wide">
            <SectionHeader
              eyebrow={t("publicPages.solutionsDeliveryPage.proofEyebrow")}
              heading={t("publicPages.solutionsDeliveryPage.proofHeading")}
              subheading={t(
                "publicPages.solutionsDeliveryPage.proofSubheading",
              )}
            />
            <div
              className={cn(
                "gap-10 lg:items-center",
                caseStudy.coverImageUrl
                  ? "grid lg:grid-cols-[1fr,1.2fr]"
                  : "mx-auto max-w-2xl",
              )}
            >
              {caseStudy.coverImageUrl && (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
                  <Image
                    src={caseStudy.coverImageUrl}
                    alt={caseStudy.title}
                    width={960}
                    height={540}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <Badge variant="secondary">{caseStudy.industry}</Badge>
                <CardHeading className="mt-3 text-2xl">
                  {caseStudy.title}
                </CardHeading>
                <ProseText className="mt-2">{caseStudy.client}</ProseText>

                {caseStudy.results.metrics.length > 0 && (
                  <Grid cols={3} gap="compact" className="mt-6">
                    {caseStudy.results.metrics.map((metric) => (
                      <StatCard
                        key={metric.label}
                        value={metric.value}
                        label={metric.label}
                      />
                    ))}
                  </Grid>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <LinkButton href={`/work/${caseStudy.slug}`}>
                    {t("publicPages.solutionsDeliveryPage.proofCta")}
                  </LinkButton>
                  {caseStudy.liveUrl && (
                    <a
                      href={caseStudy.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      {t("publicPages.solutionsDeliveryPage.proofLiveApp")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Articles */}
      {articles.length > 0 && (
        <Section variant="alternate">
          <Container>
            <SectionHeader
              eyebrow={t("publicPages.solutionsDeliveryPage.articlesEyebrow")}
              heading={t("publicPages.solutionsDeliveryPage.articlesHeading")}
              subheading={t(
                "publicPages.solutionsDeliveryPage.articlesSubheading",
              )}
            />
            <div className="grid gap-6 md:grid-cols-2">
              {articles.map((article, index) => (
                <ContentCard key={article.slug} className="flex flex-col">
                  <CardHeading>{article.title}</CardHeading>
                  <ProseText size="sm" className="mt-3 flex-1">
                    {article.excerpt}
                  </ProseText>
                  <LinkButton
                    href={`/blog/${article.slug}`}
                    variant="outline"
                    className="mt-5 self-start"
                  >
                    {index === 0
                      ? t("publicPages.solutionsDeliveryPage.articleARead")
                      : t("publicPages.solutionsDeliveryPage.articleBRead")}
                  </LinkButton>
                </ContentCard>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section variant="feature">
        <Container size="wide">
          <SectionHeader
            eyebrow={t("publicPages.solutionsDeliveryPage.faqEyebrow")}
            heading={t("publicPages.solutionsDeliveryPage.faqHeading")}
          />
          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map((item) => (
              <ContentCard key={item.q} className="bg-muted/20 p-0">
                <details className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold group-open:mb-3">
                    {item.q}
                  </summary>
                  <ProseText size="sm">{item.a}</ProseText>
                </details>
              </ContentCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section variant="cta">
        <Container size="narrow" className="text-center">
          <SectionHeader
            heading={t("publicPages.solutionsDeliveryPage.ctaHeading")}
            subheading={t("publicPages.solutionsDeliveryPage.ctaSubheading")}
          />
          <LinkButton href={`/contact?source=${LEAD_SOURCE}`} size="lg">
            {t("publicPages.solutionsDeliveryPage.ctaButton")}
          </LinkButton>
        </Container>
      </Section>
    </>
  );
}

/**
 * Hero-shaped placeholder. The whole page streams behind one boundary, so
 * without a fallback the route paints nothing at all until the tRPC lookups
 * resolve — a blank screen that reads as a broken page.
 */
function SolutionsDeliveryFallback() {
  return (
    <HeroContainer>
      <Container size="narrow" className="text-center">
        <Skeleton className="mx-auto h-12 w-3/4" />
        <Skeleton className="mx-auto mt-4 h-6 w-full max-w-2xl" />
        <Skeleton className="mx-auto mt-2 h-6 w-2/3" />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Skeleton className="h-11 w-48 rounded-full" />
          <Skeleton className="h-11 w-48 rounded-full" />
        </div>
      </Container>
    </HeroContainer>
  );
}

export default async function SolutionsDeliveryPage() {
  return (
    <Suspense fallback={<SolutionsDeliveryFallback />}>
      <SolutionsDeliveryContent />
    </Suspense>
  );
}
