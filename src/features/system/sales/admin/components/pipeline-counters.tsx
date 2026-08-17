"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { leadPipelineStatusValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/** Totals by status plus the two numbers worth watching week to week. */
export function PipelineCounters() {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data } = useQuery(trpc.sales.counters.queryOptions());

  if (!data) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap gap-6">
          <Counter label={t("sales.countersTotal")} value={data.total} />
          <Counter
            label={t("sales.countersContactedThisWeek")}
            value={data.contactedThisWeek}
          />
          <Counter
            label={t("sales.countersDemosBooked")}
            value={data.demosBooked}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {leadPipelineStatusValues
            .filter((status) => (data.byStatus[status] ?? 0) > 0)
            .map((status) => (
              <Badge key={status} variant="outline">
                {t("sales.statuses", { status })}: {data.byStatus[status]}
              </Badge>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-2xl tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
