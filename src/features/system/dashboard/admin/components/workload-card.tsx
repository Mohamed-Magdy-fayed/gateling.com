"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { SalesDashboard } from "@/features/system/sales/server/dashboard";

import { CountRow } from "./count-row";

/** The Today buckets as counts, in the same priority order the queue uses. */
export function WorkloadCard({
  workload,
}: {
  workload: SalesDashboard["workload"];
}) {
  const { t } = useTranslation();
  const isClear =
    workload.rescue +
      workload.overdue +
      workload.followUp +
      workload.newQueue ===
    0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.workloadTitle")}</CardTitle>
        <CardDescription>{t("dashboard.workloadDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isClear ? (
          <Muted>{t("dashboard.workloadClear")}</Muted>
        ) : (
          <ul className="divide-y">
            <CountRow
              label={t("sales.bucketRescue")}
              hint={t("sales.bucketRescueHint")}
              count={workload.rescue}
              urgent
            />
            <CountRow
              label={t("sales.bucketOverdue")}
              hint={t("sales.bucketOverdueHint")}
              count={workload.overdue}
              urgent
            />
            <CountRow
              label={t("sales.bucketFollowUp")}
              hint={t("sales.bucketFollowUpHint")}
              count={workload.followUp}
            />
            <CountRow
              label={t("sales.bucketNewQueue")}
              hint={
                workload.newQueueTotal > workload.newQueue
                  ? t("dashboard.newQueueCapped", {
                      shown: workload.newQueue,
                      total: workload.newQueueTotal,
                    })
                  : t("sales.bucketNewQueueHint")
              }
              count={workload.newQueue}
            />
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <Muted>
          {t("dashboard.dueTomorrow", { count: workload.dueTomorrow })}
        </Muted>
        <Link href="/sales/today" className={buttonVariants({ size: "sm" })}>
          {t("dashboard.openToday")}
          <ArrowRight aria-hidden className="rtl:rotate-180" />
        </Link>
      </CardFooter>
    </Card>
  );
}
