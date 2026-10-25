import "server-only";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  type SQL,
  sql,
} from "drizzle-orm";

import {
  LeadActivitiesTable,
  type LeadActivityType,
  type LeadPipelineStatus,
  LeadsTable,
} from "@/drizzle/schema";
import { startOfLocalDay } from "@/features/system/sales/lib/day-window";
import { TERMINAL_PIPELINE_STATUSES } from "@/features/system/sales/lib/pipeline-status";
import {
  DEPOSIT_OUTCOME_PREFIX,
  DISTRIBUTOR_BUSINESS_TYPE,
  fillDailySeries,
  lastLocalDayKeys,
  SPRINT_LENGTH_DAYS,
  SPRINT_METRICS,
  type SprintMetricId,
  type SprintTrack,
  sprintWindow,
  TOUCH_ACTIVITY_TYPES,
} from "@/features/system/sales/lib/sprint";
import type { TodayBucketId } from "@/features/system/sales/lib/today-rules";

import { type Db, getPipelineCounters, getTodayWork } from "./service";
import { getSalesSettings } from "./settings";

/**
 * Everything the sales half of `/dashboard` shows, in one call. Read-only:
 * every figure is derived from the activity log or the derived-cache columns,
 * so nothing here can drift from what `/sales/today` tells the operator.
 */

export type SprintScore = Record<SprintMetricId, number>;

export type SalesDashboard = {
  timeZone: string;
  sprint:
    | { state: "not_set" }
    | {
        state: "upcoming" | "active" | "ended";
        startKey: string;
        day: number;
        daysRemaining: number;
        totalDays: number;
        scores: Record<SprintTrack, SprintScore>;
      };
  workload: Record<TodayBucketId, number> & {
    /** New-queue matches before the daily cap — the cap hides the rest. */
    newQueueTotal: number;
    dueTomorrow: number;
  };
  upcomingDemos: {
    leadId: string;
    name: string;
    nameAr: string | null;
    scheduledAt: Date;
    meetingUrl: string | null;
  }[];
  stages: { byStatus: Record<LeadPipelineStatus, number>; total: number };
  touches: { day: string; count: number }[];
  risks: { autoPark: number; noNumber: number; whatsappNotConfirmed: number };
};

const UPCOMING_DEMO_DAYS = 7;
const TOUCH_CHART_DAYS = 14;
const MS_PER_DAY = 86_400_000;

const A = LeadActivitiesTable;
const prospectScope = eq(LeadsTable.kind, "prospect");

const emptyScore = (): SprintScore => ({
  contacted: 0,
  replied: 0,
  booked: 0,
  held: 0,
  deposits: 0,
});

/** Distinct leads per gate metric and track, for activities created in `[start, end)`. */
async function sprintScores(
  db: Db,
  start: Date,
  end: Date,
): Promise<Record<SprintTrack, SprintScore>> {
  const metricFilter = (
    id: SprintMetricId,
    types: readonly LeadActivityType[],
  ) =>
    id === "deposits"
      ? and(
          inArray(A.type, [...types]),
          ilike(A.outcome, `${DEPOSIT_OUTCOME_PREFIX}%`),
        )
      : inArray(A.type, [...types]);

  const columns = Object.fromEntries(
    SPRINT_METRICS.map(({ id, types }) => [
      id,
      sql<number>`count(distinct ${A.leadId}) filter (where ${metricFilter(id, types)})`.mapWith(
        Number,
      ),
    ]),
  ) as Record<SprintMetricId, SQL.Aliased<number> | SQL<number>>;

  const track = sql<SprintTrack>`case when ${LeadsTable.businessType} = ${DISTRIBUTOR_BUSINESS_TYPE} then 'distributor' else 'atelier' end`;

  const rows = await db
    .select({ track, ...columns })
    .from(A)
    .innerJoin(LeadsTable, and(eq(LeadsTable.id, A.leadId), prospectScope))
    // The design doc's window is on `createdAt`: backdated logs entered before
    // the sprint must not count, and in-sprint logs of earlier calls must.
    .where(
      and(
        sql`${A.createdAt} >= ${start.toISOString()}::timestamptz`,
        sql`${A.createdAt} < ${end.toISOString()}::timestamptz`,
      ),
    )
    .groupBy(track);

  const scores: Record<SprintTrack, SprintScore> = {
    atelier: emptyScore(),
    distributor: emptyScore(),
  };
  for (const { track: id, ...score } of rows) {
    if (id === "atelier" || id === "distributor") scores[id] = score;
  }
  return scores;
}

/**
 * Demos on the calendar from the start of today through the next week. A
 * demo's time is the `nextActionAt` of the lead's latest `demo_scheduled`
 * log — the same row the Meetings room is provisioned from.
 */
async function upcomingDemos(
  db: Db,
  now: Date,
  timeZone: string,
): Promise<SalesDashboard["upcomingDemos"]> {
  const from = startOfLocalDay(now, timeZone);
  const until = new Date(now.getTime() + UPCOMING_DEMO_DAYS * MS_PER_DAY);

  const latest = await db
    .selectDistinctOn([A.leadId], {
      leadId: A.leadId,
      name: LeadsTable.name,
      nameAr: LeadsTable.nameAr,
      scheduledAt: A.nextActionAt,
      meetingUrl: LeadsTable.demoMeetingUrl,
    })
    .from(A)
    .innerJoin(
      LeadsTable,
      and(
        eq(LeadsTable.id, A.leadId),
        prospectScope,
        eq(LeadsTable.pipelineStatus, "demo_scheduled"),
      ),
    )
    .where(eq(A.type, "demo_scheduled"))
    .orderBy(A.leadId, desc(A.createdAt), desc(A.occurredAt));

  return latest
    .filter(
      (row): row is typeof row & { scheduledAt: Date } =>
        row.scheduledAt !== null &&
        row.scheduledAt >= from &&
        row.scheduledAt < until,
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

/** Outbound attempts per business-local day, zero-filled. */
async function dailyTouches(
  db: Db,
  now: Date,
  timeZone: string,
): Promise<SalesDashboard["touches"]> {
  const keys = lastLocalDayKeys(now, timeZone, TOUCH_CHART_DAYS);
  const since = startOfLocalDay(
    new Date(now.getTime() - (TOUCH_CHART_DAYS - 1) * MS_PER_DAY),
    timeZone,
  );
  const day = sql<string>`to_char(${A.occurredAt} at time zone ${timeZone}, 'YYYY-MM-DD')`;

  const rows = await db
    .select({ day, count: count() })
    .from(A)
    .innerJoin(LeadsTable, and(eq(LeadsTable.id, A.leadId), prospectScope))
    .where(
      and(
        inArray(A.type, TOUCH_ACTIVITY_TYPES),
        sql`${A.occurredAt} >= ${since.toISOString()}::timestamptz`,
      ),
    )
    .groupBy(day);

  return fillDailySeries(keys, rows);
}

/** Open, contactable prospects whose WhatsApp was checked and isn't there. */
async function whatsappNotConfirmed(db: Db): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(LeadsTable)
    .where(
      and(
        prospectScope,
        eq(LeadsTable.doNotContact, false),
        eq(LeadsTable.whatsappStatus, "not_confirmed"),
        notInArray(LeadsTable.pipelineStatus, [...TERMINAL_PIPELINE_STATUSES]),
      ),
    );
  return row?.count ?? 0;
}

export async function getSalesDashboard(
  db: Db,
  now: Date = new Date(),
): Promise<SalesDashboard> {
  const { timeZone, sprintStart } = await getSalesSettings(db);
  const window = sprintWindow(sprintStart, now, timeZone);

  const [today, counters, scores, demos, touches, notConfirmed] =
    await Promise.all([
      getTodayWork(db, { now }),
      getPipelineCounters(db, now),
      window.state === "not_set"
        ? null
        : sprintScores(db, window.start, window.end),
      upcomingDemos(db, now, timeZone),
      dailyTouches(db, now, timeZone),
      whatsappNotConfirmed(db),
    ]);

  const bucketSize = (id: TodayBucketId) =>
    today.buckets.find((bucket) => bucket.id === id)?.rows.length ?? 0;
  const newQueue = today.buckets.find((bucket) => bucket.id === "newQueue");

  return {
    timeZone,
    sprint:
      window.state === "not_set" || !scores
        ? { state: "not_set" }
        : {
            state: window.state,
            startKey: window.startKey,
            day: window.day,
            daysRemaining: window.daysRemaining,
            totalDays: SPRINT_LENGTH_DAYS,
            scores,
          },
    workload: {
      rescue: bucketSize("rescue"),
      overdue: bucketSize("overdue"),
      followUp: bucketSize("followUp"),
      newQueue: bucketSize("newQueue"),
      autoPark: bucketSize("autoPark"),
      newQueueTotal: newQueue?.totalBeforeCap ?? 0,
      dueTomorrow: today.dueTomorrow,
    },
    upcomingDemos: demos,
    stages: { byStatus: counters.byStatus, total: counters.total },
    touches,
    risks: {
      autoPark: bucketSize("autoPark"),
      noNumber: counters.byStatus.blocked_no_number ?? 0,
      whatsappNotConfirmed: notConfirmed,
    },
  };
}
