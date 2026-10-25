"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadPipelineStatus } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

export type QuickViewId = "all" | "followUp" | "demos" | "won" | "closed";

/** Each quick view is a preset of the status filter; `all` clears it. */
export const QUICK_VIEWS: Record<QuickViewId, LeadPipelineStatus[]> = {
  all: [],
  followUp: ["awaiting_reply"],
  demos: ["demo_agreed", "demo_scheduled", "demo_done"],
  won: ["won"],
  closed: ["parked", "lost"],
};

/** The view whose preset equals the current status filter exactly, if any. */
export function activeQuickView(
  statuses: readonly string[],
): QuickViewId | null {
  const current = new Set(statuses);
  for (const [id, preset] of Object.entries(QUICK_VIEWS) as [
    QuickViewId,
    LeadPipelineStatus[],
  ][]) {
    if (
      preset.length === current.size &&
      preset.every((status) => current.has(status))
    ) {
      return id;
    }
  }
  return null;
}

type Props = {
  /** The status column filter currently applied. */
  statusFilter: readonly string[];
  onSelect: (statuses: LeadPipelineStatus[]) => void;
};

/**
 * One chip row: each quick view shows its count, and selecting one replaces
 * the status filter while keeping every other filter. Weekly numbers sit at
 * the end of the row.
 */
export function PipelineCounters({ statusFilter, onSelect }: Props) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data } = useQuery(trpc.sales.counters.queryOptions());
  const active = activeQuickView(statusFilter);

  if (!data) return <Skeleton className="h-8 w-full max-w-xl" />;

  const countFor = (id: QuickViewId) =>
    id === "all"
      ? data.total
      : QUICK_VIEWS[id].reduce(
          (sum, status) => sum + (data.byStatus[status] ?? 0),
          0,
        );

  return (
    <section
      aria-label={t("sales.pipelineSummary")}
      className="flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <fieldset className="flex min-w-0 flex-wrap gap-2">
        <legend className="sr-only">{t("sales.quickViewsLabel")}</legend>
        {(Object.keys(QUICK_VIEWS) as QuickViewId[]).map((id) => {
          const isActive = active === id;
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={isActive ? "secondary" : "outline"}
              aria-pressed={isActive}
              onClick={() => onSelect(QUICK_VIEWS[id])}
            >
              {t("sales.quickView", { view: id })}
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="tabular-nums"
              >
                {countFor(id)}
              </Badge>
            </Button>
          );
        })}
      </fieldset>
      <dl className="flex gap-6 text-sm">
        <Stat
          label={t("sales.countersContactedThisWeek")}
          value={data.contactedThisWeek}
        />
        <Stat label={t("sales.countersDemosBooked")} value={data.demosBooked} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
