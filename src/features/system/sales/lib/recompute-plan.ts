import type { DerivedLeadValues } from "./derived";
import type { TodayBucketId, TodayBuckets } from "./today-rules";

/**
 * Pure planning for `npm run sales:recompute`: batching, the per-bucket
 * dry-run report and the host line the script prints before touching a
 * database. Kept DB-free so the parts that decide what the script does are
 * unit-tested; the CLI only queries and writes.
 */

export function planBatches<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error(`Batch size must be a positive integer, got ${size}`);
  }
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export type BucketMove = {
  bucket: TodayBucketId;
  entering: string[];
  leaving: string[];
};

/** Leads entering and leaving each Today bucket; buckets with no movement are omitted. */
export function bucketDelta(
  before: TodayBuckets,
  after: TodayBuckets,
): BucketMove[] {
  const idsBefore = new Map(
    before.buckets.map((b) => [b.id, new Set(b.rows.map((r) => r.lead.id))]),
  );
  const moves: BucketMove[] = [];
  for (const bucket of after.buckets) {
    const was = idsBefore.get(bucket.id) ?? new Set<string>();
    const now = new Set(bucket.rows.map((r) => r.lead.id));
    const entering = [...now].filter((id) => !was.has(id));
    const leaving = [...was].filter((id) => !now.has(id));
    if (entering.length > 0 || leaving.length > 0) {
      moves.push({ bucket: bucket.id, entering, leaving });
    }
  }
  return moves;
}

function sameInstant(a: Date | null, b: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

/** Whether recomputing would write anything for this lead. */
export function derivedChanged(
  stored: DerivedLeadValues,
  computed: DerivedLeadValues,
): boolean {
  return (
    stored.followUpCount !== computed.followUpCount ||
    !sameInstant(stored.lastContactedAt, computed.lastContactedAt) ||
    !sameInstant(stored.nextActionAt, computed.nextActionAt)
  );
}

/** The two Today facts `getTodayWork` derives with `exists` subqueries. */
export function activityFacts(activities: readonly { type: string }[]): {
  hasDemoScheduledActivity: boolean;
  hasInboundReply: boolean;
} {
  return {
    hasDemoScheduledActivity: activities.some((a) => a.type === "demo_scheduled"),
    hasInboundReply: activities.some((a) => a.type === "whatsapp_reply"),
  };
}

/** The host only: never credentials, database name or query string. */
export function redactDatabaseHost(databaseUrl: string): string {
  try {
    const host = new URL(databaseUrl).hostname;
    return host || "(unparseable DATABASE_URL)";
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}
