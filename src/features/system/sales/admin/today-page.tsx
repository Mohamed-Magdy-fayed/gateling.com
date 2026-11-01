"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { H1, Lead } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import { TodayLeadCard } from "./components/today-lead-card";
import { TodayProgress } from "./components/today-progress";
import { BUCKET_COPY } from "./components/today-reason";

const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5", "s6"];

type Props = {
  /**
   * Computed on the server so the advice reflects Cairo business hours rather
   * than whatever timezone the operator's laptop happens to be in.
   */
  callingWindow: {
    isBeforeCallingHours: boolean;
    isAfterCallingHours: boolean;
  };
};

/**
 * Today's list: every lead the funnel says needs work today, as thin cards
 * that open the lead page. The work and the log happen there; a lead logged
 * today drops off this list, and the rules bring it back on the day its next
 * action (or follow-up) falls due. Shared by everyone — no per-user split.
 */
export function SalesTodayPage({ callingWindow }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  // Refetch on every visit and on focus: coming back from a lead page must
  // show the list without the lead just logged.
  const query = useQuery({
    ...trpc.sales.today.queryOptions({}),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const summary = query.data;

  const callingAdvice = callingWindow.isBeforeCallingHours
    ? t("sales.callingWindowTooEarly")
    : callingWindow.isAfterCallingHours
      ? t("sales.callingWindowTooLate")
      : null;

  // The daily new-atelier goal is shared: leads first contacted today count
  // against it, so the new queue never refills past it during the day.
  const newTarget = summary
    ? Math.max(0, summary.newQueueCap - summary.newTouchedToday)
    : 0;
  const groups = (summary?.buckets ?? [])
    .map((bucket) => ({
      id: bucket.id,
      rows:
        bucket.id === "newQueue"
          ? bucket.rows.slice(0, newTarget)
          : bucket.rows,
    }))
    .filter((group) => group.rows.length > 0);
  const left = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const done = summary?.doneToday ?? 0;
  const total = done + left;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <H1>{t("sales.todayTitle")}</H1>
          {query.isFetching && !query.isPending && (
            <output aria-label={t("sales.refreshing")}>
              <Spinner aria-hidden="true" aria-label={undefined} />
            </output>
          )}
        </div>
        <Lead>{t("sales.todayLead")}</Lead>
      </header>

      {/* Advice, never a gate — the list stays visible either way. */}
      {callingAdvice && (
        <Alert>
          <AlertDescription>{callingAdvice}</AlertDescription>
        </Alert>
      )}

      {query.isPending && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-2 w-full" />
          {SKELETON_ROWS.map((key) => (
            <Skeleton key={key} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {query.isError && !summary && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {t("sales.loadFailed")}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              {t("sales.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {summary && !summary.hasProspects && (
        <Card>
          <CardContent className="flex flex-col items-start gap-2">
            <h2 className="font-semibold text-base">{t("sales.noLeadsYet")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("sales.noLeadsYetHint")}
            </p>
            <Button
              variant="outline"
              render={(props) => (
                <Link href="/sales/leads" {...props}>
                  {t("sales.openPipeline")}
                </Link>
              )}
            />
          </CardContent>
        </Card>
      )}

      {summary?.hasProspects && (
        <>
          <TodayProgress
            done={done}
            left={left}
            ratio={total === 0 ? 1 : done / total}
            conversations={summary.conversationsToday}
          />

          {groups.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-start gap-2">
                <p className="font-semibold text-base">
                  {t("sales.allDoneTitle")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("sales.allDoneRecap", {
                    conversations: summary.conversationsToday,
                    demos: summary.demosBookedToday,
                    due: summary.dueTomorrow,
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {groups.map((group) => {
            const headingId = `today-${group.id}-heading`;
            return (
              <section
                key={group.id}
                aria-labelledby={headingId}
                className="flex flex-col gap-2"
              >
                <div className="flex flex-col gap-0.5">
                  <h2
                    id={headingId}
                    className="flex items-center gap-2 font-semibold text-base"
                  >
                    {t(BUCKET_COPY[group.id].title)}
                    <span className="font-normal text-muted-foreground text-sm tabular-nums">
                      {group.rows.length}
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {t(BUCKET_COPY[group.id].hint)}
                  </p>
                </div>
                <ul className="flex flex-col gap-2">
                  {group.rows.map((row) => (
                    <li key={row.lead.id}>
                      <TodayLeadCard lead={row.lead} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
