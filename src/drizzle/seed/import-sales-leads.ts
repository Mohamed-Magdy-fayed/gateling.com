import { readFileSync } from "node:fs";
import path from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
// From `recompute` rather than `service`: the latter is `server-only`, which
// throws under the tsx seed runner. Same implementation either way.
import { recomputeLeadDerived } from "@/features/system/sales/server/recompute";

import { DEFAULT_CSV_PATH, mapRecord, parseCsv } from "./sales-csv";

export { DEFAULT_CSV_PATH };

/**
 * Imports the prospecting CSV into the sales pipeline.
 *
 * Idempotent by (name, phone): re-running updates the existing row rather than
 * creating a second one, and only appends the seed activity if that lead has no
 * history yet. Safe to run repeatedly against production.
 *
 * Parsing and field mapping live in `sales-csv.ts` — this file is only the
 * database side.
 */

const IMPORT_ACTOR = "csv-import";

export type ImportResult = {
  created: number;
  updated: number;
  activitiesCreated: number;
  skipped: number;
};

export async function importSalesLeads(
  csvPath: string = DEFAULT_CSV_PATH,
): Promise<ImportResult> {
  const absolute = path.isAbsolute(csvPath)
    ? csvPath
    : path.resolve(process.cwd(), csvPath);

  const records = parseCsv(readFileSync(absolute, "utf8"));
  const result: ImportResult = {
    created: 0,
    updated: 0,
    activitiesCreated: 0,
    skipped: 0,
  };

  for (const record of records) {
    const mapped = mapRecord(record);
    if (!mapped) {
      result.skipped += 1;
      continue;
    }

    const { lead, activity } = mapped;
    const values = {
      ...lead,
      kind: "prospect" as const,
      updatedBy: IMPORT_ACTOR,
    };

    // Idempotency probe. Phone is the discriminator where names repeat across
    // cities; a lead with no number falls back to matching on name alone.
    const existing = await db
      .select({ id: LeadsTable.id })
      .from(LeadsTable)
      .where(
        lead.phone
          ? and(
              eq(LeadsTable.kind, "prospect"),
              eq(LeadsTable.name, lead.name),
              eq(LeadsTable.phone, lead.phone),
            )
          : and(
              eq(LeadsTable.kind, "prospect"),
              eq(LeadsTable.name, lead.name),
            ),
      )
      .limit(1);

    let leadId: string;
    if (existing.length > 0) {
      leadId = existing[0].id;
      await db.update(LeadsTable).set(values).where(eq(LeadsTable.id, leadId));
      result.updated += 1;
    } else {
      const [inserted] = await db
        .insert(LeadsTable)
        .values(values)
        .returning({ id: LeadsTable.id });
      leadId = inserted.id;
      result.created += 1;
    }

    // Seed history so the Today rules have something real to compute from on
    // first load — but only when the lead has no activity yet. That check is
    // what keeps re-runs from stacking duplicate history onto the log.
    if (activity) {
      const already = await db
        .select({ id: LeadActivitiesTable.id })
        .from(LeadActivitiesTable)
        .where(eq(LeadActivitiesTable.leadId, leadId))
        .limit(1);

      if (already.length === 0) {
        await db.insert(LeadActivitiesTable).values({
          leadId,
          type: activity.type,
          channel: activity.channel,
          occurredAt: activity.occurredAt,
          nextActionAt: activity.nextActionAt,
          outcome: "Imported from prospecting sheet",
          createdBy: IMPORT_ACTOR,
        });
        result.activitiesCreated += 1;
      }
    }

    // Always recompute: the cache columns must reflect the log whether this run
    // appended history or only refreshed the lead's own fields.
    await recomputeLeadDerived(db, leadId);
  }

  return result;
}
