import "server-only";

import { and, desc, eq, isNull, ne, or } from "drizzle-orm";

import { LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
import { startOfLocalDay } from "@/features/system/sales/lib/day-window";
import {
  type YesActivityFacts,
  type YesFunnel,
  yesFunnel,
  yesTicksFromActivities,
} from "@/features/system/sales/lib/yeses";

import { type Db, isYesTick } from "./service";
import { getSalesSettings } from "./settings";

/**
 * Everything the sales half of `/dashboard` shows, in one call: the yes
 * funnel and the demos coming up. Read-only, and derived from the activity
 * log, so nothing here can drift from what the lead pages show.
 *
 * Ateliers only: leads marked as distributors are left out.
 */

export type SalesDashboard = {
  timeZone: string;
  funnel: YesFunnel;
  upcomingDemos: {
    leadId: string;
    name: string;
    nameAr: string | null;
    scheduledAt: Date;
    meetingUrl: string | null;
  }[];
};

/** Business type that marks a distributor lead (`businessType`). */
const DISTRIBUTOR_BUSINESS_TYPE = "distributor";
const UPCOMING_DEMO_DAYS = 7;
/** "+N this week" on each funnel step. */
const RECENT_YES_DAYS = 7;
const MS_PER_DAY = 86_400_000;

const A = LeadActivitiesTable;
const prospectScope = eq(LeadsTable.kind, "prospect");
const atelierScope = and(
  prospectScope,
  or(
    isNull(LeadsTable.businessType),
    ne(LeadsTable.businessType, DISTRIBUTOR_BUSINESS_TYPE),
  ),
);

/** Every atelier lead's current yes ticks, then the funnel across them. */
async function funnel(db: Db, now: Date): Promise<YesFunnel> {
  const [leads, ticks] = await Promise.all([
    db.select({ id: LeadsTable.id }).from(LeadsTable).where(atelierScope),
    db
      .select({
        leadId: A.leadId,
        type: A.type,
        outcome: A.outcome,
        createdAt: A.createdAt,
      })
      .from(A)
      .innerJoin(LeadsTable, and(eq(LeadsTable.id, A.leadId), atelierScope))
      .where(isYesTick),
  ]);

  const byLead = new Map<string, YesActivityFacts[]>();
  for (const { leadId, ...tick } of ticks) {
    byLead.set(leadId, [...(byLead.get(leadId) ?? []), tick]);
  }
  return yesFunnel(
    leads.map(({ id }) => yesTicksFromActivities(byLead.get(id) ?? [])),
    new Date(now.getTime() - RECENT_YES_DAYS * MS_PER_DAY),
  );
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
        atelierScope,
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

export async function getSalesDashboard(
  db: Db,
  now: Date = new Date(),
): Promise<SalesDashboard> {
  const { timeZone } = await getSalesSettings(db);
  const [yesFunnelNow, demos] = await Promise.all([
    funnel(db, now),
    upcomingDemos(db, now, timeZone),
  ]);
  return { timeZone, funnel: yesFunnelNow, upcomingDemos: demos };
}
