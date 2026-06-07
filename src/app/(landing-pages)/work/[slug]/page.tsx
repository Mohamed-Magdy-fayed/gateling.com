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
import { Suspense } from "react";
import { LinkButton } from "@/components/general/link-button";
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
} from "@/components/ui/containers";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

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
    openGraph: cs.coverImageUrl
      ? { images: [{ url: cs.coverImageUrl }] }
      : undefined,
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

  return (
    <>
      {/* Hero: title, client, badge */}
      <HeroContainer>
        <Container size="narrow">
          <Link
            href="/work"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
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

            {/* Right: sticky cover image */}
            {cs.coverImageUrl && (
              <div className="sticky top-24 self-start overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
                <Image
                  src={cs.coverImageUrl}
                  alt={cs.title}
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
                <div
                  key={metric.label}
                  className="bg-primary/5 rounded-xl border p-5 text-center"
                >
                  <p className="text-primary text-3xl font-bold">
                    {metric.value}
                  </p>
                  <ProseText size="sm" className="mt-1">
                    {metric.label}
                  </ProseText>
                </div>
              ))}
            </Grid>
          )}

          {cs.results.summary && (
            <ProseText className="mt-6">{cs.results.summary}</ProseText>
          )}
        </Container>
      </Section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section variant="feature">
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
                    <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      <span className="text-primary text-sm font-semibold">
                        {getInitials(t2.clientName)}
                      </span>
                    </div>
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
