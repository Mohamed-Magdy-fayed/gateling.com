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
import { Container, Grid } from "@/components/ui/containers";
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
    <div className="relative min-h-screen bg-linear-to-b from-background via-background to-muted/30 pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-linear-to-b from-primary/10 via-transparent to-transparent blur-3xl"
      />

      <Container className="pt-12">
        {/* Back link */}
        <Link
          href="/work"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t("publicPages.workDetailPage.backToWork")}
        </Link>

        {/* Two-column header + body */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.7fr,1fr]">
          {/* Left: content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary">{cs.industry}</Badge>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                {cs.title}
              </h1>
              <p className="text-muted-foreground text-lg">{cs.client}</p>
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

            {/* Challenge */}
            <div>
              <h2 className="text-2xl font-bold">
                {t("publicPages.workDetailPage.challengeHeading")}
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {cs.problemStatement}
              </p>
            </div>

            {/* Solution */}
            <div>
              <h2 className="text-2xl font-bold">
                {t("publicPages.workDetailPage.solutionHeading")}
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {cs.solution}
              </p>
            </div>

            {/* Results */}
            <div>
              <h2 className="text-2xl font-bold">
                {t("publicPages.workDetailPage.resultsHeading")}
              </h2>

              {cs.results.metrics.length > 0 && (
                <Grid cols={3} gap="compact" className="mt-6">
                  {cs.results.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-primary/5 rounded-xl border p-5 text-center"
                    >
                      <p className="text-primary text-3xl font-bold">
                        {metric.value}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </Grid>
              )}

              {cs.results.summary && (
                <p className="text-muted-foreground mt-6 leading-relaxed">
                  {cs.results.summary}
                </p>
              )}
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

        {/* Testimonial */}
        {testimonials.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">
              {t("publicPages.workDetailPage.testimonialHeading")}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t2) => (
                <div
                  key={t2.id}
                  className="bg-muted/30 relative flex flex-col rounded-xl border p-6"
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
                  <p className="text-foreground/80 mb-6 flex-1 text-sm leading-relaxed italic">
                    &ldquo;{t2.content}&rdquo;
                  </p>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-xl border bg-muted/30 p-8 text-center">
          <p className="text-lg font-medium">
            {t("publicPages.workDetailPage.ctaDescription")}
          </p>
          <LinkButton href="/contact" size="lg" className="mt-4">
            {t("publicPages.workDetailPage.ctaButton")}
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}

export default async function WorkDetailPage({ params }: Props) {
  return (
    <Suspense>
      <WorkDetailContent params={params} />
    </Suspense>
  );
}
