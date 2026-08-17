import { asc, eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
import { computeDerived } from "@/features/system/sales/lib/derived";

/**
 * Deliberately NOT marked `server-only`, unlike the rest of the service layer.
 *
 * The seed CLI (`npm run seed -- sales-leads`) runs under tsx in plain Node,
 * where the `server-only` guard throws. The importer must recompute derived
 * values through the same code path the app uses — duplicating it would let
 * imported leads drift from logged ones — so the shared piece lives here and
 * `service.ts` re-exports it for application callers.
 */

type Db = typeof database;
type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Recompute the derived cache columns for one lead from its activity log.
 *
 * These columns exist purely for query performance. They are recomputed from
 * activities after every append and must never be edited directly — the log is
 * the source of truth, which is what makes the Today buckets trustworthy.
 */
export async function recomputeLeadDerived(
  tx: Executor,
  leadId: string,
): Promise<void> {
  const activities = await tx
    .select({
      type: LeadActivitiesTable.type,
      occurredAt: LeadActivitiesTable.occurredAt,
      nextActionAt: LeadActivitiesTable.nextActionAt,
      nextActionDoneAt: LeadActivitiesTable.nextActionDoneAt,
    })
    .from(LeadActivitiesTable)
    .where(eq(LeadActivitiesTable.leadId, leadId))
    .orderBy(asc(LeadActivitiesTable.occurredAt));

  await tx
    .update(LeadsTable)
    .set(computeDerived(activities))
    .where(eq(LeadsTable.id, leadId));
}
