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
import { Suspense, ViewTransition } from "react";
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
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";
import { breadcrumbJsonLd, canonicalUrl } from "@/lib/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caller = await api();
  const cs = await caller.caseStudies
    .publicGetBySlug({ slug })
    .catch(() => null);
  if (!cs) return {};
  return {
    title: `${cs.title} — ${cs.client}`,
    description: cs.results.summary || cs.problemStatement.slice(0, 155),
    alternates: { canonical: canonicalUrl(`/work/${slug}`) },
    openGraph: (() => {
      const img = cs.media?.find((m) => m.isFeatured)?.url ?? cs.coverImageUrl;
      return img
        ? { type: "article", images: [{ url: img }] }
        : { type: "article" };
    })(),
  };
}

async function WorkDetailContent({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: cs.title,
    about: cs.industry,
    description: cs.results.summary || cs.problemStatement,
    image: cs.media?.find((m) => m.isFeatured)?.url ?? cs.coverImageUrl,
    url: canonicalUrl(`/work/${cs.slug}`),
    creator: { "@type": "Organization", "@id": "https://gateling.com/#org" },
    ...(testimonials.length > 0
      ? {
          review: testimonials.map((rev) => ({
            "@type": "Review",
            reviewBody: rev.content,
            author: { "@type": "Person", name: rev.clientName },
            ...(rev.rating
              ? {
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: rev.rating,
                    bestRating: 5,
                  },
                }
              : {}),
          })),
        }
      : {}),
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
      <HeroContainer>
        <Container size="narrow">
          <Link
            href="/work"
            transitionTypes={["nav-back"]}
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
                rel="noopener noreferrer"
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
            </div>

            {/* Right: media section or fallback cover image */}
            <ViewTransition name={`case-${cs.slug}`}>
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
            </ViewTransition>
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
  return (
    <Suspense>
      <WorkDetailContent params={params} />
    </Suspense>
  );
}
