import type { LeadActivityType } from "@/drizzle/schema";

import {
  localDateKey,
  startOfLocalDay,
  wallClockToInstant,
} from "./day-window";

/**
 * The sales-sprint scorecard rules from
 * `docs/designs/distributor-offer-sell-first.md`, kept pure so the window and
 * pace maths are testable at their boundaries. The dashboard query only
 * supplies counts; everything that decides what those counts mean lives here.
 */

export const SPRINT_LENGTH_DAYS = 14;

export type SprintTrack = "atelier" | "distributor";

/** "Fewer than N contacted" is row 1/2 of each day-14 gate. */
export const SPRINT_CONTACT_TARGET: Record<SprintTrack, number> = {
  atelier: 40,
  distributor: 30,
};

/** Leads with this `businessType` form the distributor track; all others are atelier. */
export const DISTRIBUTOR_BUSINESS_TYPE = "distributor";

/** A deposit is a `note` whose outcome starts with this marker. */
export const DEPOSIT_OUTCOME_PREFIX = "DEPOSIT";

export type SprintMetricId =
  | "contacted"
  | "replied"
  | "booked"
  | "held"
  | "deposits";

/** Funnel order. Each metric counts distinct leads with an in-window activity. */
export const SPRINT_METRICS: readonly {
  id: SprintMetricId;
  types: readonly LeadActivityType[];
}[] = [
  { id: "contacted", types: ["whatsapp_sent", "call"] },
  { id: "replied", types: ["whatsapp_reply"] },
  { id: "booked", types: ["demo_scheduled"] },
  { id: "held", types: ["demo_done"] },
  { id: "deposits", types: ["note"] },
];

/** Outbound attempts — what the daily touches chart counts. */
export const TOUCH_ACTIVITY_TYPES = [
  "whatsapp_sent",
  "call",
  "no_answer",
  "call_unclear",
] as const satisfies readonly LeadActivityType[];

export type SprintWindow =
  | { state: "not_set" }
  | {
      state: "upcoming" | "active" | "ended";
      startKey: string;
      /** Local midnight of day 1. */
      start: Date;
      /** Local midnight after the last day — the window is `[start, end)`. */
      end: Date;
      /** 1-based day number, clamped to `0..SPRINT_LENGTH_DAYS`. 0 = not started. */
      day: number;
      /** Days left including today; 0 once the sprint has ended. */
      daysRemaining: number;
    };

const MS_PER_DAY = 86_400_000;

/** Calendar maths on `YYYY-MM-DD` keys, independent of any timezone. */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function daysBetweenKeys(from: string, to: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);
}

function localMidnight(key: string, timeZone: string): Date | null {
  const instant = wallClockToInstant(`${key}T00:00`, timeZone);
  // On a midnight spring-forward day, snap to the day's first real instant.
  return instant ? startOfLocalDay(instant, timeZone) : null;
}

export function sprintWindow(
  startKey: string | null,
  now: Date,
  timeZone: string,
): SprintWindow {
  if (!startKey) return { state: "not_set" };
  const start = localMidnight(startKey, timeZone);
  const end = localMidnight(
    addDaysToKey(startKey, SPRINT_LENGTH_DAYS),
    timeZone,
  );
  if (!start || !end) return { state: "not_set" };

  const elapsed = daysBetweenKeys(startKey, localDateKey(now, timeZone));
  if (elapsed < 0) {
    return {
      state: "upcoming",
      startKey,
      start,
      end,
      day: 0,
      daysRemaining: SPRINT_LENGTH_DAYS,
    };
  }
  if (elapsed >= SPRINT_LENGTH_DAYS) {
    return {
      state: "ended",
      startKey,
      start,
      end,
      day: SPRINT_LENGTH_DAYS,
      daysRemaining: 0,
    };
  }
  return {
    state: "active",
    startKey,
    start,
    end,
    day: elapsed + 1,
    daysRemaining: SPRINT_LENGTH_DAYS - elapsed,
  };
}

/**
 * Contacts per day still needed to hit the target. Null when the target is
 * met or no days remain — there is no pace to keep.
 */
export function requiredDailyPace(
  target: number,
  done: number,
  daysRemaining: number,
): number | null {
  const remaining = target - done;
  if (remaining <= 0 || daysRemaining <= 0) return null;
  return Math.ceil(remaining / daysRemaining);
}

/** Whole-percent step conversion; null when there is nothing to convert from. */
export function conversionRate(count: number, from: number): number | null {
  if (from <= 0) return null;
  return Math.round((count / from) * 100);
}

/** The last `n` local day keys, oldest first, ending today. */
export function lastLocalDayKeys(
  now: Date,
  timeZone: string,
  n: number,
): string[] {
  const today = localDateKey(now, timeZone);
  return Array.from({ length: n }, (_, i) => addDaysToKey(today, i - (n - 1)));
}

/** Zero-fill a sparse `{ day, count }` list onto a fixed run of day keys. */
export function fillDailySeries(
  keys: readonly string[],
  rows: readonly { day: string; count: number }[],
): { day: string; count: number }[] {
  const byDay = new Map(rows.map((row) => [row.day, row.count]));
  return keys.map((day) => ({ day, count: byDay.get(day) ?? 0 }));
}
