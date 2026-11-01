import type { TodayBucketId } from "@/features/system/sales/lib/today-rules";

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
