import "server-only";

import { and, count, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import {
  LeadActivitiesTable,
  type LeadActivity,
  type LeadActivityType,
  type LeadPipelineStatus,
  type LeadSocialProfiles,
  LeadsTable,
} from "@/drizzle/schema";
import { SALES_EXPORT_ROW_LIMIT } from "@/features/core/data-table/lib/limits";
import {
  dueTomorrowWindow,
  startOfLocalDay,
  startOfNextLocalDay,
} from "@/features/system/sales/lib/day-window";
import { CONTACT_ACTIVITY_TYPES } from "@/features/system/sales/lib/derived";
import { largestFollowers } from "@/features/system/sales/lib/social-profiles";
import {
  isBlockedOutbound,
  shouldDischargePromises,
} from "@/features/system/sales/lib/pipeline-status";
import {
  computeTodayBuckets,
  DEFAULT_TODAY_RULES_CONFIG,
  type TodayLeadInput,
} from "@/features/system/sales/lib/today-rules";

import { SalesError } from "./errors";
import { buildPipelineWhere, pipelineSortExpr } from "./filters";
import { type Executor, recomputeLeadDerived } from "./recompute";
import type {
  BulkSetStatusInput,
  CreateLeadInput,
  ListPipelineInput,
  LogActivityInput,
  PipelineFilterInput,
  SetSocialProfileInput,
  TodayWorkSummary,
  UpdateLeadInput,
} from "./schemas";
import { getSalesSettings } from "./settings";

/**
 * Re-exported so application callers have one import surface. The
 * implementation lives in `./recompute` because the seed CLI needs it from
 * plain Node, where this file's `server-only` guard would throw.
 */
export { recomputeLeadDerived };

/**
 * Every lead and activity operation lives here as a plain typed function over a
 * database handle. Nothing in this file knows about tRPC, React or HTTP — the
 * router is a thin wrapper, and a future MCP server calls exactly these
 * functions rather than reimplementing the rules.
 *
 * Two invariants this module is responsible for:
 *
 *  1. `lead_activities` is append-only. There is no update or delete function
 *     for activities, and there must not be one.
 *  2. The derived columns on `leads` are never written by callers — only by
 *     `recomputeLeadDerived`, always inside the same transaction as the append
 *     that changed them.
 */

export type Db = typeof database;

const prospectScope = eq(LeadsTable.kind, "prospect");

/**
 * Append an activity and, optionally, move the lead's pipeline status — in one
 * transaction, so a logged call can never leave the pipeline out of step with
 * its own history.
 */
export async function logActivity(
  db: Db,
  input: LogActivityInput,
  actorId: string,
): Promise<{ activityId: string }> {
  return db.transaction((tx) => logActivityInTx(tx, input, actorId));
}

/**
 * `logActivity` without a transaction of its own, so bulk actions can log many
 * leads in one. The caller owns the transaction.
 *
 * The lead row is locked first: concurrent logs on one lead serialise, and a
 * customer or unknown id fails before anything is written.
 *
 * Contacting the lead discharges its outstanding promises (you said you would
 * call back and you just did), and so does closing it — a lost lead must not
 * resurface in Overdue. Discharge stamps `nextActionDoneAt` on the earlier
 * rows rather than editing them away.
 */
export async function logActivityInTx(
  tx: Executor,
  input: LogActivityInput,
  actorId: string,
): Promise<{ activityId: string }> {
  const [lead] = await tx
    .select({ doNotContact: LeadsTable.doNotContact })
    .from(LeadsTable)
    .where(and(eq(LeadsTable.id, input.leadId), prospectScope))
    .for("update");
  if (!lead) throw new SalesError("SALES_LEAD_NOT_PROSPECT", input.leadId);
  if (isBlockedOutbound(input.type, lead.doNotContact)) {
    throw new SalesError("SALES_DO_NOT_CONTACT", input.leadId);
  }

  const occurredAt = input.occurredAt ?? new Date();

  if (shouldDischargePromises(input.type, input.pipelineStatus)) {
    await tx
      .update(LeadActivitiesTable)
      .set({ nextActionDoneAt: occurredAt })
      .where(
        and(
          eq(LeadActivitiesTable.leadId, input.leadId),
          isNull(LeadActivitiesTable.nextActionDoneAt),
          sql`${LeadActivitiesTable.nextActionAt} is not null`,
        ),
      );
  }

  const [activity] = await tx
    .insert(LeadActivitiesTable)
    .values({
      leadId: input.leadId,
      type: input.type,
      channel: input.channel ?? null,
      occurredAt,
      outcome: input.outcome ?? null,
      notes: input.notes ?? null,
      nextActionAt: input.nextActionAt ?? null,
      createdBy: actorId,
    })
    .returning({ id: LeadActivitiesTable.id });

  if (input.pipelineStatus) {
    await tx
      .update(LeadsTable)
      .set({ pipelineStatus: input.pipelineStatus, updatedBy: actorId })
      .where(and(eq(LeadsTable.id, input.leadId), prospectScope));
  }

  await recomputeLeadDerived(tx, input.leadId);

  return { activityId: activity.id };
}

/**
 * Park a lead that has gone quiet. Recorded as an activity so the reason
 * survives in the timeline rather than only as a status flip.
 */
export async function parkLead(
  db: Db,
  leadId: string,
  actorId: string,
  reason?: string,
): Promise<void> {
  await db.transaction((tx) => parkLeadInTx(tx, leadId, actorId, reason));
}

/** `parkLead` inside the caller's transaction. */
export async function parkLeadInTx(
  tx: Executor,
  leadId: string,
  actorId: string,
  reason?: string,
): Promise<void> {
  await logActivityInTx(
    tx,
    {
      leadId,
      type: "status_change",
      outcome: reason ?? "Parked after unanswered follow-ups",
      pipelineStatus: "parked",
    },
    actorId,
  );
}

export async function createLead(
  db: Db,
  input: CreateLeadInput,
  actorId: string,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(LeadsTable)
    .values({ ...input, kind: "prospect", updatedBy: actorId })
    .returning({ id: LeadsTable.id });
  return row;
}

export async function updateLead(
  db: Db,
  input: UpdateLeadInput,
  actorId: string,
): Promise<void> {
  const { id, ...fields } = input;
  const updated = await db
    .update(LeadsTable)
    .set({ ...fields, updatedBy: actorId })
    .where(and(eq(LeadsTable.id, id), prospectScope))
    .returning({ id: LeadsTable.id });
  // An unknown or non-prospect id must not report success.
  if (updated.length === 0) throw new SalesError("SALES_LEAD_NOT_PROSPECT", id);
}

/**
 * Records research for one platform. Read-modify-write under a row lock, so
 * two agents updating different platforms cannot drop each other's entry, and
 * `socialFollowers` (the new-queue ranking) moves with the profiles.
 */
export async function setSocialProfile(
  db: Db,
  input: SetSocialProfileInput,
  actorId: string,
): Promise<LeadSocialProfiles> {
  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select({
        socialProfiles: LeadsTable.socialProfiles,
        socialFollowers: LeadsTable.socialFollowers,
      })
      .from(LeadsTable)
      .where(and(eq(LeadsTable.id, input.id), prospectScope))
      .for("update");
    if (!lead) throw new SalesError("SALES_LEAD_NOT_PROSPECT", input.id);

    const { [input.platform]: _previous, ...others } = lead.socialProfiles;
    const checkedAt = new Date().toISOString();
    const socialProfiles: LeadSocialProfiles =
      input.status === "clear"
        ? others
        : {
            ...others,
            [input.platform]:
              input.status === "found"
                ? {
                    status: "found",
                    url: input.url,
                    handle: input.handle ?? null,
                    followers: input.followers ?? null,
                    posts: input.posts ?? null,
                    bio: input.bio ?? null,
                    checkedAt,
                  }
                : { status: "notFound", checkedAt },
          };

    await tx
      .update(LeadsTable)
      .set({
        socialProfiles,
        socialFollowers: largestFollowers(socialProfiles) ?? lead.socialFollowers,
        updatedBy: actorId,
      })
      .where(eq(LeadsTable.id, input.id));
    return socialProfiles;
  });
}

export async function getLead(db: Db, id: string) {
  const [lead] = await db
    .select()
    .from(LeadsTable)
    .where(and(eq(LeadsTable.id, id), prospectScope))
    .limit(1);

  if (!lead) return null;

  const activities: LeadActivity[] = await db
    .select()
    .from(LeadActivitiesTable)
    .where(eq(LeadActivitiesTable.leadId, id))
    // Reverse chronological: most recent first.
    .orderBy(
      desc(LeadActivitiesTable.occurredAt),
      desc(LeadActivitiesTable.createdAt),
    );

  return { lead, activities };
}

/**
 * The columns the pipeline grid shows and exports. Inbound-only fields
 * (email, message, UTM, IP) never leave the server for a prospect row.
 */
const pipelineGridSelect = {
  id: LeadsTable.id,
  name: LeadsTable.name,
  nameAr: LeadsTable.nameAr,
  city: LeadsTable.city,
  area: LeadsTable.area,
  phone: LeadsTable.phone,
  phoneSecondary: LeadsTable.phoneSecondary,
  whatsappStatus: LeadsTable.whatsappStatus,
  whatsappProfileName: LeadsTable.whatsappProfileName,
  tier: LeadsTable.tier,
  businessType: LeadsTable.businessType,
  socialFollowers: LeadsTable.socialFollowers,
  pipelineStatus: LeadsTable.pipelineStatus,
  doNotContact: LeadsTable.doNotContact,
  followUpCount: LeadsTable.followUpCount,
  lastContactedAt: LeadsTable.lastContactedAt,
  nextActionAt: LeadsTable.nextActionAt,
  createdAt: LeadsTable.createdAt,
};

export async function listPipeline(db: Db, input: ListPipelineInput) {
  const where = buildPipelineWhere(input);

  const [{ total }] = await db
    .select({ total: count() })
    .from(LeadsTable)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);

  const rows = await db
    .select(pipelineGridSelect)
    .from(LeadsTable)
    .where(where)
    .orderBy(...pipelineSortExpr(input.sorting))
    .limit(input.perPage)
    .offset((page - 1) * input.perPage);

  return { rows, pageCount, total: Number(total) };
}

/**
 * Every row matching the grid's filters, up to `limit`. Fetches one extra row
 * so the caller can tell a complete export from a truncated one.
 */
export async function exportPipeline(
  db: Db,
  input: PipelineFilterInput,
  limit: number = SALES_EXPORT_ROW_LIMIT,
) {
  const rows = await db
    .select(pipelineGridSelect)
    .from(LeadsTable)
    .where(buildPipelineWhere(input))
    .orderBy(...pipelineSortExpr(input.sorting))
    .limit(limit + 1);

  const truncated = rows.length > limit;
  return { rows: truncated ? rows.slice(0, limit) : rows, truncated, limit };
}

const BULK_PARK_REASON = "Parked from the pipeline (bulk)";
const BULK_LOST_REASON = "Marked lost from the pipeline (bulk)";

/**
 * Close many leads at once. Each lead gets its own `status_change` activity
 * (parks go through `parkLeadInTx`), all in one transaction: an unknown or
 * non-prospect id rolls the whole batch back, so the result is all or nothing.
 */
export async function bulkSetStatus(
  db: Db,
  input: BulkSetStatusInput,
  actorId: string,
): Promise<{ updated: number }> {
  const ids = [...new Set(input.ids)];
  await db.transaction(async (tx) => {
    // Bounds how long a slow batch can hold its row locks.
    await tx.execute(sql`set local statement_timeout = '10s'`);
    for (const leadId of ids) {
      if (input.status === "parked") {
        await parkLeadInTx(tx, leadId, actorId, BULK_PARK_REASON);
      } else {
        await logActivityInTx(
          tx,
          {
            leadId,
            type: "status_change",
            outcome: BULK_LOST_REASON,
            pipelineStatus: "lost",
          },
          actorId,
        );
      }
    }
  });
  return { updated: ids.length };
}

/**
 * Load the pipeline and bucket it. The rule evaluation itself is delegated to
 * `computeTodayBuckets` so it stays pure and testable — this function's only
 * job is to assemble its input.
 */
export async function getTodayWork(
  db: Db,
  options: { now?: Date; newQueueCap?: number } = {},
): Promise<TodayWorkSummary> {
  const now = options.now ?? new Date();
  const settings = await getSalesSettings(db);
  const newQueueCap = options.newQueueCap ?? settings.newQueueCap;

  const [leads, stats] = await Promise.all([
    todayLeadInputs(db),
    todayStats(db, now, settings.timeZone),
  ]);

  return {
    ...computeTodayBuckets(
      leads,
      now,
      { ...DEFAULT_TODAY_RULES_CONFIG, newQueueCap },
      startOfLocalDay(now, settings.timeZone),
    ),
    ...stats,
    timeZone: settings.timeZone,
    newQueueCap,
    now,
  };
}

/** Conversations for the progress chip: a two-way exchange or a demo step. */
const CONVERSATION_TODAY_TYPES = [
  "call",
  "whatsapp_reply",
  "demo_agreed",
  "demo_scheduled",
] as const satisfies readonly LeadActivityType[];

/**
 * Today's counts for the progress header, in one statement. Day boundaries
 * are business-local (Cairo), not UTC.
 */
async function todayStats(db: Db, now: Date, timeZone: string) {
  const dayStart = startOfLocalDay(now, timeZone).toISOString();
  const dayEnd = startOfNextLocalDay(now, timeZone).toISOString();
  const tomorrow = dueTomorrowWindow(now, timeZone);
  const A = LeadActivitiesTable;

  const [row] = await db
    .select({
      doneToday: sql<number>`count(distinct ${A.leadId})`.mapWith(Number),
      conversationsToday:
        sql<number>`count(distinct ${A.leadId}) filter (where ${inArray(A.type, CONVERSATION_TODAY_TYPES)})`.mapWith(
          Number,
        ),
      demosBookedToday:
        sql<number>`count(distinct ${A.leadId}) filter (where ${A.type} = 'demo_scheduled')`.mapWith(
          Number,
        ),
      // First contact ever falls today — a lead first reached yesterday and
      // again today is not a new lead.
      newTouchedToday: sql<number>`(
        select count(*) from (
          select ${A.leadId}, min(${A.occurredAt}) as first_contact
          from ${A}
          inner join ${LeadsTable} on ${LeadsTable.id} = ${A.leadId} and ${prospectScope}
          where ${inArray(A.type, CONTACT_ACTIVITY_TYPES)}
          group by ${A.leadId}
        ) first_contacts
        where first_contact >= ${dayStart}::timestamptz and first_contact < ${dayEnd}::timestamptz
      )`.mapWith(Number),
      dueTomorrow: sql<number>`(
        select count(*) from ${LeadsTable}
        where ${prospectScope}
          and ${LeadsTable.nextActionAt} >= ${tomorrow.start.toISOString()}::timestamptz
          and ${LeadsTable.nextActionAt} < ${tomorrow.end.toISOString()}::timestamptz
      )`.mapWith(Number),
      hasProspects: sql<boolean>`exists (select 1 from ${LeadsTable} where ${prospectScope})`,
    })
    .from(A)
    .innerJoin(LeadsTable, and(eq(LeadsTable.id, A.leadId), prospectScope))
    .where(
      and(
        sql`${A.occurredAt} >= ${dayStart}::timestamptz`,
        sql`${A.occurredAt} < ${dayEnd}::timestamptz`,
        // A note is research, not work on the lead: it must not count as done.
        ne(A.type, "note"),
      ),
    );

  return {
    doneToday: row?.doneToday ?? 0,
    conversationsToday: row?.conversationsToday ?? 0,
    demosBookedToday: row?.demosBookedToday ?? 0,
    newTouchedToday: row?.newTouchedToday ?? 0,
    dueTomorrow: row?.dueTomorrow ?? 0,
    hasProspects: Boolean(row?.hasProspects),
  };
}

/** Every prospect as the rules module's input. */
async function todayLeadInputs(db: Db): Promise<TodayLeadInput[]> {
  // Two boolean facts per lead that the cache columns cannot express. Computed
  // as aggregates so this stays a single round trip rather than N+1.
  const rows = await db
    .select({
      id: LeadsTable.id,
      name: LeadsTable.name,
      nameAr: LeadsTable.nameAr,
      city: LeadsTable.city,
      area: LeadsTable.area,
      phone: LeadsTable.phone,
      phoneSecondary: LeadsTable.phoneSecondary,
      whatsappStatus: LeadsTable.whatsappStatus,
      whatsappProfileName: LeadsTable.whatsappProfileName,
      tier: LeadsTable.tier,
      socialFollowers: LeadsTable.socialFollowers,
      socialPlatform: LeadsTable.socialPlatform,
      socialHandle: LeadsTable.socialHandle,
      address: LeadsTable.address,
      socialProfiles: LeadsTable.socialProfiles,
      pipelineStatus: LeadsTable.pipelineStatus,
      doNotContact: LeadsTable.doNotContact,
      notes: LeadsTable.notes,
      lastContactedAt: LeadsTable.lastContactedAt,
      followUpCount: LeadsTable.followUpCount,
      nextActionAt: LeadsTable.nextActionAt,
      hasDemoScheduledActivity: sql<boolean>`exists (
        select 1 from ${LeadActivitiesTable}
        where ${LeadActivitiesTable.leadId} = ${LeadsTable.id}
          and ${LeadActivitiesTable.type} = 'demo_scheduled'
      )`,
      hasInboundReply: sql<boolean>`exists (
        select 1 from ${LeadActivitiesTable}
        where ${LeadActivitiesTable.leadId} = ${LeadsTable.id}
          and ${LeadActivitiesTable.type} = 'whatsapp_reply'
      )`,
    })
    .from(LeadsTable)
    .where(prospectScope);

  return rows.map((row) => ({
    ...row,
    hasDemoScheduledActivity: Boolean(row.hasDemoScheduledActivity),
    hasInboundReply: Boolean(row.hasInboundReply),
  }));
}

export type PipelineCounters = {
  byStatus: Record<LeadPipelineStatus, number>;
  total: number;
  contactedThisWeek: number;
  demosBooked: number;
};

/** The simple counter strip: totals by status, this week's contacts, demos. */
export async function getPipelineCounters(
  db: Db,
  now: Date = new Date(),
): Promise<PipelineCounters> {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [statusRows, contactedRow] = await Promise.all([
    db
      .select({
        pipelineStatus: LeadsTable.pipelineStatus,
        count: count(),
      })
      .from(LeadsTable)
      .where(prospectScope)
      .groupBy(LeadsTable.pipelineStatus),

    db
      .select({ count: count() })
      .from(LeadsTable)
      .where(
        and(prospectScope, sql`${LeadsTable.lastContactedAt} >= ${weekAgo}`),
      ),
  ]);

  const byStatus = {} as Record<LeadPipelineStatus, number>;
  let total = 0;
  for (const row of statusRows) {
    byStatus[row.pipelineStatus] = row.count;
    total += row.count;
  }

  // "Booked" means a demo is actually on the calendar or already happened —
  // `demo_agreed` alone is a promise, which is what the Rescue bucket chases.
  const demosBooked =
    (byStatus.demo_scheduled ?? 0) +
    (byStatus.demo_done ?? 0) +
    (byStatus.won ?? 0);

  return {
    byStatus,
    total,
    contactedThisWeek: contactedRow[0]?.count ?? 0,
    demosBooked,
  };
}
