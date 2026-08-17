import type {
  LeadPipelineStatus,
  LeadTier,
  WhatsappStatus,
} from "@/drizzle/schema";

/**
 * The whole point of the sales module: given pipeline state, decide who to
 * contact today and why.
 *
 * Deliberately pure — no database, no `Date.now()`, no translation. `now` is
 * injected so every threshold can be tested at its boundary, and reasons are
 * returned as structured data for the UI to translate. These thresholds get
 * tuned, so they live here rather than inline in a component.
 */

export type TodayLeadInput = {
  id: string;
  name: string;
  nameAr: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  whatsappStatus: WhatsappStatus;
  whatsappProfileName: string | null;
  tier: LeadTier | null;
  socialFollowers: number | null;
  pipelineStatus: LeadPipelineStatus;
  doNotContact: boolean;
  notes: string | null;
  lastContactedAt: Date | null;
  followUpCount: number;
  /** Earliest unfulfilled promised follow-up, or null if nothing is promised. */
  nextActionAt: Date | null;
  /** True when a `demo_scheduled` activity exists — the Rescue escape hatch. */
  hasDemoScheduledActivity: boolean;
  /** True when a `whatsapp_reply` has ever been received. */
  hasInboundReply: boolean;
};

export type TodayBucketId =
  | "rescue"
  | "overdue"
  | "followUp"
  | "newQueue"
  | "autoPark";

/**
 * Why a lead is in its bucket, as data rather than a sentence — the UI turns
 * these into EN/AR strings, so the rules stay free of translation concerns.
 */
export type TodayReason =
  | { kind: "rescue"; daysSinceContact: number | null }
  | { kind: "overdue"; daysOverdue: number }
  | { kind: "followUp"; daysSinceContact: number | null; followUpCount: number }
  | { kind: "newQueue"; tier: LeadTier | null; followers: number | null }
  | { kind: "autoPark"; followUpCount: number };

export type TodayRow = {
  lead: TodayLeadInput;
  reason: TodayReason;
  /** Whole days since last contact; null when never contacted. */
  daysSinceLastContact: number | null;
  /** First non-empty line of `notes`, used as the suggested opening angle. */
  openingAngle: string | null;
};

export type TodayBucket = {
  id: TodayBucketId;
  rows: TodayRow[];
  /** Rows matched before the daily cap was applied. Only differs for newQueue. */
  totalBeforeCap: number;
};

export type TodayBuckets = {
  /** Always in priority order: rescue → overdue → followUp → newQueue → autoPark. */
  buckets: TodayBucket[];
  totalActionable: number;
};

export type TodayRulesConfig = {
  /** Rescue: a `demo_agreed` lead uncontacted for longer than this is going cold. */
  rescueStaleDays: number;
  /** Follow-up: an `awaiting_reply` lead untouched for longer than this is due. */
  followUpStaleDays: number;
  /**
   * Stop following up at this many unanswered attempts. Chasing past two risks
   * a WhatsApp ban on the business number, so this is a safety limit, not a
   * preference.
   */
  followUpMaxCount: number;
  /**
   * Daily ceiling on fresh dials. An uncapped list of 25 gets ignored; a list
   * of 10 gets worked.
   */
  newQueueCap: number;
};

export const DEFAULT_TODAY_RULES_CONFIG: TodayRulesConfig = {
  rescueStaleDays: 2,
  followUpStaleDays: 3,
  followUpMaxCount: 2,
  newQueueCap: 10,
};

const MS_PER_DAY = 86_400_000;

/** Whole days elapsed, floored. `daysBetween(now, 2 days + 1h ago) === 2`. */
function daysBetween(now: Date, then: Date): number {
  return Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY);
}

/**
 * "Older than N days". A lead contacted exactly N days ago is NOT yet stale —
 * it becomes stale the moment it passes N. Never contacted counts as stale:
 * a lead that agreed to a demo and was never called is the most perishable
 * thing in the pipeline, not the least.
 */
function isStalerThan(now: Date, then: Date | null, days: number): boolean {
  if (then === null) return true;
  return now.getTime() - then.getTime() > days * MS_PER_DAY;
}

/** Tier sort weight. Untiered leads sort last — they are unqualified, not big. */
function tierRank(tier: LeadTier | null): number {
  if (tier === "A") return 0;
  if (tier === "B") return 1;
  if (tier === "C") return 2;
  return 3;
}

function openingAngleFrom(notes: string | null): string | null {
  if (!notes) return null;
  const firstLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstLine ?? null;
}

/**
 * Leads that must never be offered as an outreach action.
 *
 * `doNotContact` is self-explanatory. `parked` leads were deliberately set
 * down — surfacing them again defeats the point, and in the auto-park bucket
 * a "Park" button on an already-parked lead would never clear.
 */
function isSuppressed(lead: TodayLeadInput): boolean {
  return lead.doNotContact || lead.pipelineStatus === "parked";
}

function toRow(lead: TodayLeadInput, reason: TodayReason, now: Date): TodayRow {
  return {
    lead,
    reason,
    daysSinceLastContact: lead.lastContactedAt
      ? daysBetween(now, lead.lastContactedAt)
      : null,
    openingAngle: openingAngleFrom(lead.notes),
  };
}

/**
 * Bucket every lead, in priority order. A lead lands in at most one bucket —
 * the first it matches — so the page never asks for the same call twice.
 */
export function computeTodayBuckets(
  leads: readonly TodayLeadInput[],
  now: Date,
  config: TodayRulesConfig = DEFAULT_TODAY_RULES_CONFIG,
): TodayBuckets {
  const rescue: TodayRow[] = [];
  const overdue: TodayRow[] = [];
  const followUp: TodayRow[] = [];
  const newQueueMatches: TodayRow[] = [];
  const autoPark: TodayRow[] = [];

  for (const lead of leads) {
    if (isSuppressed(lead)) continue;

    // 1. Rescue — someone said yes and is going cold. Most perishable.
    if (
      lead.pipelineStatus === "demo_agreed" &&
      !lead.hasDemoScheduledActivity &&
      isStalerThan(now, lead.lastContactedAt, config.rescueStaleDays)
    ) {
      rescue.push(
        toRow(
          lead,
          {
            kind: "rescue",
            daysSinceContact: lead.lastContactedAt
              ? daysBetween(now, lead.lastContactedAt)
              : null,
          },
          now,
        ),
      );
      continue;
    }

    // 2. Overdue commitment — a promise made and not kept. Breaks trust fastest.
    if (
      lead.nextActionAt !== null &&
      lead.nextActionAt.getTime() < now.getTime()
    ) {
      overdue.push(
        toRow(
          lead,
          { kind: "overdue", daysOverdue: daysBetween(now, lead.nextActionAt) },
          now,
        ),
      );
      continue;
    }

    // 3. Follow-up due — warm but unanswered, still under the safety limit.
    if (
      lead.pipelineStatus === "awaiting_reply" &&
      isStalerThan(now, lead.lastContactedAt, config.followUpStaleDays) &&
      lead.followUpCount < config.followUpMaxCount
    ) {
      followUp.push(
        toRow(
          lead,
          {
            kind: "followUp",
            daysSinceContact: lead.lastContactedAt
              ? daysBetween(now, lead.lastContactedAt)
              : null,
            followUpCount: lead.followUpCount,
          },
          now,
        ),
      );
      continue;
    }

    // 4. New queue — fresh dials, biggest businesses first.
    // `blocked_no_number` cannot reach here (its status is not `new`), and the
    // phone check catches a `new` lead whose number was never recovered.
    if (
      lead.pipelineStatus === "new" &&
      !lead.doNotContact &&
      hasUsablePhone(lead)
    ) {
      newQueueMatches.push(
        toRow(
          lead,
          {
            kind: "newQueue",
            tier: lead.tier,
            followers: lead.socialFollowers,
          },
          now,
        ),
      );
      continue;
    }

    // 5. Auto-park candidates — chased twice, still silent. Offer a one-click
    // Park rather than a third message.
    if (
      lead.followUpCount >= config.followUpMaxCount &&
      !lead.hasInboundReply
    ) {
      autoPark.push(
        toRow(
          lead,
          { kind: "autoPark", followUpCount: lead.followUpCount },
          now,
        ),
      );
    }
  }

  newQueueMatches.sort(compareNewQueue);
  const newQueue = newQueueMatches.slice(0, Math.max(0, config.newQueueCap));

  const buckets: TodayBucket[] = [
    { id: "rescue", rows: rescue, totalBeforeCap: rescue.length },
    { id: "overdue", rows: overdue, totalBeforeCap: overdue.length },
    { id: "followUp", rows: followUp, totalBeforeCap: followUp.length },
    {
      id: "newQueue",
      rows: newQueue,
      totalBeforeCap: newQueueMatches.length,
    },
    { id: "autoPark", rows: autoPark, totalBeforeCap: autoPark.length },
  ];

  return {
    buckets,
    totalActionable: buckets.reduce(
      (sum, bucket) => sum + bucket.rows.length,
      0,
    ),
  };
}

function hasUsablePhone(lead: TodayLeadInput): boolean {
  return Boolean(lead.phone && lead.phone.trim().length > 0);
}

/** Tier first, then reach. Both descending in value, nulls last. */
function compareNewQueue(a: TodayRow, b: TodayRow): number {
  const byTier = tierRank(a.lead.tier) - tierRank(b.lead.tier);
  if (byTier !== 0) return byTier;

  const followersA = a.lead.socialFollowers ?? -1;
  const followersB = b.lead.socialFollowers ?? -1;
  if (followersA !== followersB) return followersB - followersA;

  return a.lead.name.localeCompare(b.lead.name);
}

/** Convenience for the counters strip and tests. */
export function bucketById(
  buckets: TodayBuckets,
  id: TodayBucketId,
): TodayBucket {
  const found = buckets.buckets.find((bucket) => bucket.id === id);
  if (!found) throw new Error(`Unknown bucket: ${id}`);
  return found;
}
