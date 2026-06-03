import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import { Container, Grid } from "@/components/ui/containers";
import { db } from "@/drizzle";
import { CaseStudiesTable } from "@/drizzle/schema";
import { getT } from "@/features/core/i18n/server";
import { api } from "@/integrations/trpc/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await db
    .select({ slug: CaseStudiesTable.slug })
    .from(CaseStudiesTable)
    .where(
      and(
        eq(CaseStudiesTable.status, "published"),
        isNull(CaseStudiesTable.deletedAt),
      ),
    )
    .orderBy(asc(CaseStudiesTable.sortOrder), desc(CaseStudiesTable.createdAt))
    .catch(() => []);
  return slugs.map((cs) => ({ slug: cs.slug }));
}

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

export default async function WorkDetailPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getT();
  const caller = await api();
  const cs = await caller.caseStudies
    .publicGetBySlug({ slug })
    .catch(() => null);

  if (!cs) notFound();

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
