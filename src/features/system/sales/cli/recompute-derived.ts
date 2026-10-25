/**
 * Re-derives the cached lead columns (`lastContactedAt`, `followUpCount`,
 * `nextActionAt`) from each prospect's activity log, through the same
 * `recomputeLeadDerived` the app calls after every log.
 *
 *   npm run sales:recompute -- --dry-run     # report only, writes nothing
 *   npm run sales:recompute -- --yes         # write the changed leads
 *
 * Needed once after a change to the derivation rules (`lib/derived.ts`), so
 * existing leads match what a fresh log would produce.
 *
 * DATABASE_URL in `.env` is PRODUCTION by default. The target host is printed
 * first, nothing is written without `--yes`, and the dry run lists how many
 * leads would enter or leave each Today bucket so the effect is reviewed
 * before it is applied. Re-running is safe: only leads whose values differ
 * are written, so a second `--yes` writes nothing.
 */
import path from "node:path";
import { parseArgs } from "node:util";

import { config as loadEnv } from "dotenv";
import { asc, eq } from "drizzle-orm";

import { LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
import { computeDerived } from "@/features/system/sales/lib/derived";
import {
  activityFacts,
  bucketDelta,
  derivedChanged,
  planBatches,
  redactDatabaseHost,
} from "@/features/system/sales/lib/recompute-plan";
import {
  computeTodayBuckets,
  type TodayLeadInput,
} from "@/features/system/sales/lib/today-rules";

loadEnv({
  path: process.env.DOTENV_CONFIG_PATH ?? path.resolve(process.cwd(), ".env"),
});

const DEFAULT_BATCH_SIZE = 50;
/** Lead names shown per bucket in the dry-run report. */
const SAMPLE_NAMES = 5;

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    yes: { type: "boolean", default: false },
    "batch-size": { type: "string", default: String(DEFAULT_BATCH_SIZE) },
  },
});

type Plan = {
  total: number;
  changedIds: string[];
  before: TodayLeadInput[];
  after: TodayLeadInput[];
};

async function buildPlan(
  db: (typeof import("@/drizzle"))["db"],
): Promise<Plan> {
  const leads = await db
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
    })
    .from(LeadsTable)
    .where(eq(LeadsTable.kind, "prospect"))
    .orderBy(asc(LeadsTable.createdAt));

  const activities = await db
    .select({
      leadId: LeadActivitiesTable.leadId,
      type: LeadActivitiesTable.type,
      occurredAt: LeadActivitiesTable.occurredAt,
      nextActionAt: LeadActivitiesTable.nextActionAt,
      nextActionDoneAt: LeadActivitiesTable.nextActionDoneAt,
    })
    .from(LeadActivitiesTable)
    .innerJoin(LeadsTable, eq(LeadsTable.id, LeadActivitiesTable.leadId))
    .where(eq(LeadsTable.kind, "prospect"));

  const byLead = Map.groupBy(activities, (a) => a.leadId);
  const plan: Plan = { total: leads.length, changedIds: [], before: [], after: [] };

  for (const lead of leads) {
    const log = byLead.get(lead.id) ?? [];
    const facts = activityFacts(log);
    const computed = computeDerived(log);
    const stored = {
      lastContactedAt: lead.lastContactedAt,
      followUpCount: lead.followUpCount,
      nextActionAt: lead.nextActionAt,
    };
    if (derivedChanged(stored, computed)) plan.changedIds.push(lead.id);
    plan.before.push({ ...lead, ...facts });
    plan.after.push({ ...lead, ...facts, ...computed });
  }
  return plan;
}

function printReport(plan: Plan, now: Date) {
  const names = new Map(plan.before.map((l) => [l.id, l.name]));
  const sample = (ids: string[]) => {
    const shown = ids.slice(0, SAMPLE_NAMES).map((id) => names.get(id) ?? id);
    const more = ids.length - shown.length;
    return more > 0 ? `${shown.join(", ")} … +${more}` : shown.join(", ");
  };

  console.log(`Prospects scanned: ${plan.total}`);
  console.log(`Leads whose derived values change: ${plan.changedIds.length}`);

  const moves = bucketDelta(
    computeTodayBuckets(plan.before, now),
    computeTodayBuckets(plan.after, now),
  );
  if (moves.length === 0) {
    console.log("Today buckets: no lead changes bucket.");
    return;
  }
  console.log("Today buckets (as of now):");
  for (const move of moves) {
    console.log(
      `  ${move.bucket}: +${move.entering.length} entering, -${move.leaving.length} leaving`,
    );
    if (move.entering.length) console.log(`    entering: ${sample(move.entering)}`);
    if (move.leaving.length) console.log(`    leaving:  ${sample(move.leaving)}`);
  }
}

async function main(): Promise<number> {
  const target = redactDatabaseHost(process.env.DATABASE_URL ?? "");
  console.log(`Target database host: ${target}`);

  if (args["dry-run"] === args.yes) {
    console.error(
      "Pass exactly one of --dry-run (report only) or --yes (write changes).",
    );
    return 1;
  }
  const batchSize = Number(args["batch-size"]);

  const { db, closeDbConnection } = await import("@/drizzle");
  const { recomputeLeadDerived } = await import(
    "@/features/system/sales/server/recompute"
  );

  try {
    const plan = await buildPlan(db);
    printReport(plan, new Date());

    if (args["dry-run"]) {
      console.log("Dry run: nothing written. Re-run with --yes to apply.");
      return 0;
    }

    let written = 0;
    let failed = 0;
    for (const batch of planBatches(plan.changedIds, batchSize)) {
      let current = "";
      try {
        await db.transaction(async (tx) => {
          for (const leadId of batch) {
            current = leadId;
            await recomputeLeadDerived(tx, leadId);
          }
        });
        written += batch.length;
      } catch (error) {
        failed += batch.length;
        const cause = error instanceof Error ? error.message : String(error);
        console.error(
          `Batch rolled back (${batch.length} leads) at lead ${current}: ${cause}`,
        );
      }
    }

    console.log(`Leads updated: ${written}`);
    if (failed > 0) {
      console.error(`Leads not updated (batch rolled back): ${failed}`);
      return 1;
    }
    return 0;
  } finally {
    await closeDbConnection();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exit(1);
  });
