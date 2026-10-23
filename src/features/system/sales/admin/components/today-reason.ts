import type { useTranslation } from "@/features/core/i18n/client";
import type { TodayBucketId, TodayRow } from "@/features/system/sales/lib/today-rules";

type Translate = ReturnType<typeof useTranslation>["t"];

/**
 * Copy per bucket. `as const` keeps the keys as literals so the typed `t()`
 * can tell they take no arguments.
 */
export const BUCKET_COPY = {
  rescue: { title: "sales.bucketRescue", hint: "sales.bucketRescueHint" },
  overdue: { title: "sales.bucketOverdue", hint: "sales.bucketOverdueHint" },
  followUp: { title: "sales.bucketFollowUp", hint: "sales.bucketFollowUpHint" },
  newQueue: { title: "sales.bucketNewQueue", hint: "sales.bucketNewQueueHint" },
  autoPark: { title: "sales.bucketAutoPark", hint: "sales.bucketAutoParkHint" },
} as const satisfies Record<TodayBucketId, { title: string; hint: string }>;

/** Turns the rules module's structured reason into a sentence. */
export function reasonText(reason: TodayRow["reason"], t: Translate): string {
  switch (reason.kind) {
    case "rescue":
      return reason.daysSinceContact === null
        ? t("sales.reasonRescueNeverContacted")
        : t("sales.reasonRescue", { days: reason.daysSinceContact });
    case "overdue":
      return reason.daysOverdue <= 0
        ? t("sales.reasonOverdueToday")
        : t("sales.reasonOverdue", { days: reason.daysOverdue });
    case "followUp":
      return t("sales.reasonFollowUp", {
        days: reason.daysSinceContact ?? 0,
        count: reason.followUpCount,
      });
    case "newQueue":
      return t("sales.reasonNewQueue");
    case "autoPark":
      return t("sales.reasonAutoPark", { count: reason.followUpCount });
  }
}
