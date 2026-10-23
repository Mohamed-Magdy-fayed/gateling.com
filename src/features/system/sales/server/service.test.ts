import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";

import { LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
import { connectTestDb, describeWithDb } from "@/test/test-db";

import { SalesError } from "./errors";
import {
  type Db,
  logActivity,
  logActivityInTx,
  parkLead,
  parkLeadInTx,
} from "./service";

/**
 * Runs against TEST_DATABASE_URL only (see `src/test/test-db.ts`); skipped
 * otherwise. Every test starts from empty lead tables.
 */
describeWithDb("sales service (database)", () => {
  let db: Db;
  let close: () => Promise<void>;
  const ACTOR = "test-actor";
  const DAY = 86_400_000;

  beforeAll(() => {
    const conn = connectTestDb();
    db = conn.db as unknown as Db;
    close = conn.close;
  });
  afterAll(async () => close());
  beforeEach(async () => {
    await db.delete(LeadsTable);
  });

  async function prospect(overrides: Partial<typeof LeadsTable.$inferInsert> = {}) {
    const [row] = await db
      .insert(LeadsTable)
      .values({ kind: "prospect", name: "Test Atelier", ...overrides })
      .returning({ id: LeadsTable.id });
    return row.id;
  }

  async function withPromise(leadId: string) {
    await logActivity(
      db,
      {
        leadId,
        type: "call",
        pipelineStatus: "callback_scheduled",
        nextActionAt: new Date(Date.now() + DAY),
      },
      ACTOR,
    );
  }

  async function leadRow(id: string) {
    const [row] = await db.select().from(LeadsTable).where(eq(LeadsTable.id, id));
    return row;
  }

  it("rejects a customer-kind lead before writing anything", async () => {
    const [inbound] = await db
      .insert(LeadsTable)
      .values({ kind: "inbound", name: "Contact form" })
      .returning({ id: LeadsTable.id });

    await expect(
      logActivity(db, { leadId: inbound.id, type: "note" }, ACTOR),
    ).rejects.toMatchObject({ appCode: "SALES_LEAD_NOT_PROSPECT" });

    const activities = await db
      .select()
      .from(LeadActivitiesTable)
      .where(eq(LeadActivitiesTable.leadId, inbound.id));
    expect(activities).toEqual([]);
  });

  it("rejects outreach to a do-not-contact lead, but still logs a note", async () => {
    const id = await prospect({ doNotContact: true });

    const outreach = logActivity(db, { leadId: id, type: "whatsapp_sent" }, ACTOR);
    await expect(outreach).rejects.toBeInstanceOf(SalesError);
    await expect(outreach).rejects.toMatchObject({ appCode: "SALES_DO_NOT_CONTACT" });

    await expect(
      logActivity(db, { leadId: id, type: "note", notes: "asked us to stop" }, ACTOR),
    ).resolves.toHaveProperty("activityId");
  });

  it("discharges an open promise when the lead is contacted", async () => {
    const id = await prospect();
    await withPromise(id);
    expect((await leadRow(id)).nextActionAt).not.toBeNull();

    await logActivity(db, { leadId: id, type: "no_answer" }, ACTOR);
    expect((await leadRow(id)).nextActionAt).toBeNull();
  });

  it("discharges an open promise when a status change closes the lead", async () => {
    const id = await prospect();
    await withPromise(id);

    await logActivity(
      db,
      { leadId: id, type: "status_change", pipelineStatus: "lost" },
      ACTOR,
    );
    const row = await leadRow(id);
    expect(row.pipelineStatus).toBe("lost");
    expect(row.nextActionAt).toBeNull();
  });

  it("keeps the promise on a status change to an open status", async () => {
    const id = await prospect();
    await withPromise(id);

    await logActivity(
      db,
      { leadId: id, type: "status_change", pipelineStatus: "contacted" },
      ACTOR,
    );
    expect((await leadRow(id)).nextActionAt).not.toBeNull();
  });

  it("parks a lead with a status_change row and discharges its promise", async () => {
    const id = await prospect();
    await withPromise(id);

    await parkLead(db, id, ACTOR, "No reply after two messages");
    const row = await leadRow(id);
    expect(row.pipelineStatus).toBe("parked");
    expect(row.nextActionAt).toBeNull();
  });

  it("runs InTx variants inside the caller's transaction, all or nothing", async () => {
    const a = await prospect();
    const b = await prospect();

    await expect(
      db.transaction(async (tx) => {
        await parkLeadInTx(tx, a, ACTOR);
        await logActivityInTx(tx, { leadId: b, type: "note" }, ACTOR);
        throw new Error("abort the batch");
      }),
    ).rejects.toThrow("abort the batch");

    expect((await leadRow(a)).pipelineStatus).toBe("new");
    const activities = await db.select().from(LeadActivitiesTable);
    expect(activities).toEqual([]);
  });

  it("resets the follow-up count after an answered call", async () => {
    const id = await prospect();
    await logActivity(db, { leadId: id, type: "no_answer" }, ACTOR);
    await logActivity(db, { leadId: id, type: "whatsapp_sent" }, ACTOR);
    expect((await leadRow(id)).followUpCount).toBe(2);

    await logActivity(db, { leadId: id, type: "call" }, ACTOR);
    expect((await leadRow(id)).followUpCount).toBe(0);
  });
});
