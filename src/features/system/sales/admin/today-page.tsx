"use client";

import { useQuery } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, Lead } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type {
  TodayBucket,
  TodayBucketId,
} from "@/features/system/sales/lib/today-rules";
import { useTRPC } from "@/integrations/trpc/client";

import { PipelineCounters } from "./components/pipeline-counters";
import { TodayLeadRow } from "./components/today-lead-row";

/**
 * Copy per bucket. `as const` keeps the keys as literals so the typed `t()`
 * can tell they take no arguments.
 */
const BUCKET_COPY = {
  rescue: { title: "sales.bucketRescue", hint: "sales.bucketRescueHint" },
  overdue: { title: "sales.bucketOverdue", hint: "sales.bucketOverdueHint" },
  followUp: { title: "sales.bucketFollowUp", hint: "sales.bucketFollowUpHint" },
  newQueue: { title: "sales.bucketNewQueue", hint: "sales.bucketNewQueueHint" },
  autoPark: { title: "sales.bucketAutoPark", hint: "sales.bucketAutoParkHint" },
} as const satisfies Record<TodayBucketId, { title: string; hint: string }>;

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

export function SalesTodayPage({ callingWindow }: Props) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const { data, isPending } = useQuery(trpc.sales.today.queryOptions({}));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <H1>{t("sales.todayTitle")}</H1>
        <Lead>{t("sales.todayLead")}</Lead>
      </div>

      {/* Advice, never a gate — the buckets stay visible either way. */}
      {callingWindow.isBeforeCallingHours && (
        <Alert>
          <AlertDescription>
            {t("sales.callingWindowTooEarly")}
          </AlertDescription>
        </Alert>
      )}
      {callingWindow.isAfterCallingHours && (
        <Alert>
          <AlertDescription>{t("sales.callingWindowTooLate")}</AlertDescription>
        </Alert>
      )}

      <PipelineCounters />

      {isPending && <Skeleton className="h-64 w-full" />}

      {data?.totalActionable === 0 && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground text-sm">
            {t("sales.todayEmpty")}
          </CardContent>
        </Card>
      )}

      {data && data.totalActionable > 0 && (
        <div className="flex flex-col gap-4">
          {data.buckets.map((bucket) => (
            <BucketCard key={bucket.id} bucket={bucket} />
          ))}
        </div>
      )}
    </div>
  );
}

function BucketCard({ bucket }: { bucket: TodayBucket }) {
  const { t } = useTranslation();
  const copy = BUCKET_COPY[bucket.id];

  // An empty bucket is a good thing — say nothing and save the vertical space.
  if (bucket.rows.length === 0) return null;

  const isCapped = bucket.totalBeforeCap > bucket.rows.length;

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{t(copy.title)}</CardTitle>
          <Badge variant="secondary">{bucket.rows.length}</Badge>
          {isCapped && (
            <Badge variant="outline">
              {t("sales.capNotice", {
                shown: bucket.rows.length,
                total: bucket.totalBeforeCap,
              })}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{t(copy.hint)}</p>
      </CardHeader>
      <CardContent className="p-0">
        {bucket.rows.map((row) => (
          <TodayLeadRow
            key={row.lead.id}
            row={row}
            showPark={bucket.id === "autoPark"}
          />
        ))}
      </CardContent>
    </Card>
  );
}
