import "server-only";

import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import {
  LeadActivitiesTable,
  type LeadActivity,
  type LeadPipelineStatus,
  LeadsTable,
} from "@/drizzle/schema";
import { isContactActivity } from "@/features/system/sales/lib/derived";
import {
  computeTodayBuckets,
  DEFAULT_TODAY_RULES_CONFIG,
  type TodayBuckets,
  type TodayLeadInput,
} from "@/features/system/sales/lib/today-rules";

import { recomputeLeadDerived } from "./recompute";
import type {
  CreateLeadInput,
  ListPipelineInput,
  LogActivityInput,
  UpdateLeadInput,
} from "./schemas";

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
 *
 * Logging a contact also discharges any outstanding promise on the lead: if you
 * said you would call back and you just did, the commitment is kept. That is
 * recorded by stamping `nextActionDoneAt` on the earlier rows rather than
 * editing them away.
 */
export async function logActivity(
  db: Db,
  input: LogActivityInput,
  actorId: string,
): Promise<{ activityId: string }> {
  return db.transaction(async (tx) => {
    const occurredAt = input.occurredAt ?? new Date();

    if (isContactActivity(input.type)) {
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
  });
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
  await logActivity(
    db,
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
  await db
    .update(LeadsTable)
    .set({ ...fields, updatedBy: actorId })
    .where(and(eq(LeadsTable.id, id), prospectScope));
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

export async function listPipeline(db: Db, input: ListPipelineInput) {
  const conditions = [prospectScope];

  if (input.pipelineStatus !== "all") {
    conditions.push(eq(LeadsTable.pipelineStatus, input.pipelineStatus));
  }
  if (input.tier !== "all") {
    conditions.push(eq(LeadsTable.tier, input.tier));
  }
  if (input.whatsappStatus !== "all") {
    conditions.push(eq(LeadsTable.whatsappStatus, input.whatsappStatus));
  }
  if (input.city?.trim()) {
    conditions.push(ilike(LeadsTable.city, `%${input.city.trim()}%`));
  }

  let where = and(...conditions);
  if (input.globalFilter?.trim()) {
    const like = `%${input.globalFilter.trim()}%`;
    const textWhere = or(
      ilike(LeadsTable.name, like),
      ilike(LeadsTable.nameAr, like),
      ilike(LeadsTable.phone, like),
      ilike(LeadsTable.phoneSecondary, like),
    );
    where = and(where, textWhere);
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(LeadsTable)
    .where(where);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);

  const rows = await db
    .select()
    .from(LeadsTable)
    .where(where)
    .orderBy(...orderForPipeline(input))
    .limit(input.perPage)
    .offset((page - 1) * input.perPage);

  return { rows, pageCount, total: Number(total) };
}

function orderForPipeline(input: ListPipelineInput) {
  const first = input.sorting[0];
  if (first?.id === "name") {
    return [first.desc ? desc(LeadsTable.name) : asc(LeadsTable.name)];
  }
  if (first?.id === "tier") {
    return [first.desc ? desc(LeadsTable.tier) : asc(LeadsTable.tier)];
  }
  if (first?.id === "lastContactedAt") {
    return [
      first.desc
        ? desc(LeadsTable.lastContactedAt)
        : asc(LeadsTable.lastContactedAt),
    ];
  }
  return [desc(LeadsTable.createdAt)];
}

/**
 * Load the pipeline and bucket it. The rule evaluation itself is delegated to
 * `computeTodayBuckets` so it stays pure and testable — this function's only
 * job is to assemble its input.
 */
export async function getTodayWork(
  db: Db,
  options: { now?: Date; newQueueCap?: number } = {},
): Promise<TodayBuckets> {
  const now = options.now ?? new Date();

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

  const leads: TodayLeadInput[] = rows.map((row) => ({
    ...row,
    hasDemoScheduledActivity: Boolean(row.hasDemoScheduledActivity),
    hasInboundReply: Boolean(row.hasInboundReply),
  }));

  return computeTodayBuckets(leads, now, {
    ...DEFAULT_TODAY_RULES_CONFIG,
    newQueueCap: options.newQueueCap ?? DEFAULT_TODAY_RULES_CONFIG.newQueueCap,
  });
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
