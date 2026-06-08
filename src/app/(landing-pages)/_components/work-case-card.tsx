import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { Badge } from "@/components/ui/badge";
import {
  CardHeading,
  ContentCard,
  ProseText,
} from "@/components/ui/containers";
import type { CaseStudyResults } from "@/drizzle/schema";
import { getT } from "@/features/core/i18n/server";

export type WorkCase = {
  slug: string;
  client: string;
  industry: string;
  problemStatement: string;
  solution: string;
  results: CaseStudyResults;
  liveUrl: string | null;
  coverImageUrl: string | null | undefined;
};

type Props = {
  cs: WorkCase;
  variant: "preview" | "full";
};

export async function WorkCaseCard({ cs, variant }: Props) {
  const { t } = await getT();
  const firstMetric = cs.results.metrics[0];

  if (variant === "preview") {
    return (
      <ContentCard className="group flex flex-col overflow-hidden p-0 hover:-translate-y-1 hover:shadow-lg">
        {cs.coverImageUrl ? (
          <ViewTransition name={`case-${cs.slug}`}>
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={cs.coverImageUrl}
                alt={cs.client}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </ViewTransition>
        ) : (
          <div className="aspect-video w-full bg-muted/40 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">{cs.industry}</span>
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <Badge variant="secondary" className="mb-3 w-fit">
            {cs.industry}
          </Badge>
          {firstMetric && (
            <p className="text-primary mb-2 text-sm font-semibold">
              {"✦"} {firstMetric.value} — {firstMetric.label}
            </p>
          )}
          <CardHeading className="mb-2 transition-colors group-hover:text-primary">
            {cs.client}
          </CardHeading>
          <ProseText size="sm" className="flex-1 line-clamp-3">
            {cs.problemStatement}
          </ProseText>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Link
              href={`/work/${cs.slug}`}
              transitionTypes={["nav-forward"]}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <span>{t("common.readMore")}</span>
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
            </Link>
            {cs.liveUrl && (
              <Link
                href={cs.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <ExternalLinkIcon className="h-3 w-3" />
                {t("publicPages.workDetailPage.viewLiveApp")}
              </Link>
            )}
          </div>
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard className="p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardHeading className="text-2xl font-bold">{cs.client}</CardHeading>
          <Badge variant="secondary" className="mt-1">
            {cs.industry}
          </Badge>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {firstMetric && (
            <p className="text-primary font-bold">
              {"→"} {firstMetric.value} {firstMetric.label}
            </p>
          )}
          {cs.liveUrl && (
            <a
              href={cs.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              {t("publicPages.workDetailPage.viewLiveApp")}
            </a>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
            {t("publicPages.workPage.challengeLabel")}
          </p>
          <ProseText size="sm">{cs.problemStatement}</ProseText>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
            {t("publicPages.workPage.solutionLabel")}
          </p>
          <ProseText size="sm">{cs.solution}</ProseText>
        </div>
      </div>
      <div className="mt-5">
        <Link
          href={`/work/${cs.slug}`}
          transitionTypes={["nav-forward"]}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          {t("common.readMore")}
          <ArrowRightIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>
    </ContentCard>
  );
}
