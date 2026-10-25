"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { leadPipelineStatusValues } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { isTerminalPipelineStatus } from "@/features/system/sales/lib/pipeline-status";
import type { SalesDashboard } from "@/features/system/sales/server/dashboard";

/** Current stage counts as start-anchored bars; closed stages are muted. */
export function PipelineStagesCard({
  stages,
}: {
  stages: SalesDashboard["stages"];
}) {
  const { t } = useTranslation();
  const max = Math.max(1, ...Object.values(stages.byStatus));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.stagesTitle")}</CardTitle>
        <CardDescription>{t("dashboard.stagesDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {stages.total === 0 ? (
          <Muted>{t("dashboard.stagesEmpty")}</Muted>
        ) : (
          <ul className="flex flex-col gap-2">
            {leadPipelineStatusValues.map((status) => {
              const count = stages.byStatus[status] ?? 0;
              const label = t("sales.statuses", { status });
              return (
                <li
                  key={status}
                  className="grid grid-cols-[minmax(7rem,auto)_1fr_auto] items-center gap-3 text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    aria-hidden
                  >
                    <div
                      className={
                        isTerminalPipelineStatus(status)
                          ? "h-full rounded-full bg-muted-foreground/50"
                          : "h-full rounded-full bg-primary"
                      }
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="min-w-6 text-end tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
