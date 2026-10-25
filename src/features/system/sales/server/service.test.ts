import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  LeadActivitiesTable,
  LeadsTable,
  SettingsTable,
} from "@/drizzle/schema";
import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";
import { connectTestDb, describeWithDb } from "@/test/test-db";

import { SalesError } from "./errors";
import {
  bulkSetStatus,
  type Db,
  exportPipeline,
  getTodayWork,
  listPipeline,
  logActivity,
  logActivityInTx,
  parkLead,
  parkLeadInTx,
  updateLead,
} from "./service";

const CAP_CODE = SYSTEM_SETTING_CODE.SALES_DAILY_NEW_QUEUE_CAP;

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

  async function prospect(
    overrides: Partial<typeof LeadsTable.$inferInsert> = {},
  ) {
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
    const [row] = await db
      .select()
      .from(LeadsTable)
      .where(eq(LeadsTable.id, id));
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

  it("refuses to report an update of a non-prospect lead as done", async () => {
    const [inbound] = await db
      .insert(LeadsTable)
      .values({ kind: "inbound", name: "Contact form" })
      .returning({ id: LeadsTable.id });
    await expect(
      updateLead(db, { id: inbound.id, city: "Giza" }, ACTOR),
    ).rejects.toMatchObject({ appCode: "SALES_LEAD_NOT_PROSPECT" });
  });

  it("updates only the fields given", async () => {
    const id = await prospect({ pipelineStatus: "lost", doNotContact: true });
    await updateLead(db, { id, city: "Giza" }, ACTOR);
    const row = await leadRow(id);
    expect(row).toMatchObject({
      city: "Giza",
      pipelineStatus: "lost",
      doNotContact: true,
    });
  });

  it("rejects outreach to a do-not-contact lead, but still logs a note", async () => {
    const id = await prospect({ doNotContact: true });

    const outreach = logActivity(
      db,
      { leadId: id, type: "whatsapp_sent" },
      ACTOR,
    );
    await expect(outreach).rejects.toBeInstanceOf(SalesError);
    await expect(outreach).rejects.toMatchObject({
      appCode: "SALES_DO_NOT_CONTACT",
    });

    await expect(
      logActivity(
        db,
        { leadId: id, type: "note", notes: "asked us to stop" },
        ACTOR,
      ),
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

  // Undo of a terminal outcome is a compensating log, not a deletion: the
  // timeline keeps both rows, and the promise the outcome discharged returns.
  it("undoes Not interested by logging the previous status and promise back", async () => {
    const id = await prospect();
    await withPromise(id);
    const before = await leadRow(id);

    await logActivity(
      db,
      { leadId: id, type: "call", channel: "phone", pipelineStatus: "lost" },
      ACTOR,
    );
    expect((await leadRow(id)).nextActionAt).toBeNull();

    await logActivity(
      db,
      {
        leadId: id,
        type: "status_change",
        pipelineStatus: before.pipelineStatus,
        nextActionAt: before.nextActionAt,
      },
      ACTOR,
    );
    const after = await leadRow(id);
    expect(after.pipelineStatus).toBe("callback_scheduled");
    expect(after.nextActionAt).toEqual(before.nextActionAt);
  });

  describe("getTodayWork", () => {
    // 13:00 in Cairo (UTC+3) on a Friday.
    const NOW = new Date("2026-10-23T10:00:00Z");
    const HOUR = 3_600_000;
    const ago = (ms: number) => new Date(NOW.getTime() - ms);

    afterEach(async () => {
      await db.delete(SettingsTable).where(eq(SettingsTable.code, CAP_CODE));
    });

    it("uses the request cap, else the settings cap, else 10", async () => {
      expect((await getTodayWork(db, { now: NOW })).newQueueCap).toBe(10);
      expect(
        (await getTodayWork(db, { now: NOW, newQueueCap: 3 })).newQueueCap,
      ).toBe(3);

      await db.insert(SettingsTable).values({
        code: CAP_CODE,
        label: "policy",
        amount: 7,
        createdBy: ACTOR,
      });
      expect((await getTodayWork(db, { now: NOW })).newQueueCap).toBe(7);
      expect(
        (await getTodayWork(db, { now: NOW, newQueueCap: 3 })).newQueueCap,
      ).toBe(3);
    });

    it("counts today's work by Cairo day, distinct leads", async () => {
      const [a, b, c, d] = await Promise.all([
        prospect(),
        prospect(),
        prospect(),
        prospect(),
      ]);
      // a: first reached yesterday, answered today — not a new lead.
      await logActivity(
        db,
        { leadId: a, type: "no_answer", occurredAt: ago(24 * HOUR) },
        ACTOR,
      );
      await logActivity(
        db,
        { leadId: a, type: "call", occurredAt: ago(HOUR) },
        ACTOR,
      );
      // b: first contact today, no conversation.
      await logActivity(
        db,
        { leadId: b, type: "whatsapp_sent", occurredAt: ago(2 * HOUR) },
        ACTOR,
      );
      // c: demo booked today for tomorrow 11:00 Cairo.
      await logActivity(
        db,
        {
          leadId: c,
          type: "demo_scheduled",
          occurredAt: ago(HOUR),
          nextActionAt: new Date("2026-10-24T08:00:00Z"),
          pipelineStatus: "demo_scheduled",
        },
        ACTOR,
      );
      // d: a note only — work done, not a contact.
      await logActivity(
        db,
        { leadId: d, type: "note", occurredAt: ago(HOUR) },
        ACTOR,
      );

      const today = await getTodayWork(db, { now: NOW });
      expect(today).toMatchObject({
        doneToday: 4,
        conversationsToday: 2,
        demosBookedToday: 1,
        newTouchedToday: 2,
        dueTomorrow: 1,
        hasProspects: true,
        timeZone: "Africa/Cairo",
      });
    });

    it("counts an activity at 00:30 Cairo as today and 23:30 the day before as yesterday", async () => {
      const id = await prospect();
      // 2026-10-22T21:30Z is 00:30 on the 23rd in Cairo.
      await logActivity(
        db,
        {
          leadId: id,
          type: "note",
          occurredAt: new Date("2026-10-22T21:30:00Z"),
        },
        ACTOR,
      );
      expect((await getTodayWork(db, { now: NOW })).doneToday).toBe(1);

      const other = await prospect();
      // 2026-10-22T20:30Z is 23:30 on the 22nd in Cairo.
      await logActivity(
        db,
        {
          leadId: other,
          type: "note",
          occurredAt: new Date("2026-10-22T20:30:00Z"),
        },
        ACTOR,
      );
      expect((await getTodayWork(db, { now: NOW })).doneToday).toBe(1);
    });

    it("reports an empty pipeline", async () => {
      expect((await getTodayWork(db, { now: NOW })).hasProspects).toBe(false);
    });
  });

  it("resets the follow-up count after an answered call", async () => {
    const id = await prospect();
    await logActivity(db, { leadId: id, type: "no_answer" }, ACTOR);
    await logActivity(db, { leadId: id, type: "whatsapp_sent" }, ACTOR);
    expect((await leadRow(id)).followUpCount).toBe(2);

    await logActivity(db, { leadId: id, type: "call" }, ACTOR);
    expect((await leadRow(id)).followUpCount).toBe(0);
  });
  describe("pipeline grid", () => {
    it("lists prospects only, filtered and paged", async () => {
      await prospect({ name: "Maadi Tailors", city: "Maadi", tier: "A" });
      await prospect({ name: "Zamalek Couture", city: "Zamalek" });
      await db
        .insert(LeadsTable)
        .values({ kind: "inbound", name: "Maadi form" });

      const result = await listPipeline(db, {
        page: 1,
        perPage: 20,
        sorting: [],
        globalFilter: "maadi",
        columnFilters: [{ id: "tier", value: ["A"] }],
      });
      expect(result.total).toBe(1);
      expect(result.rows[0]).toMatchObject({ name: "Maadi Tailors" });
      expect(result.rows[0]).not.toHaveProperty("ipAddress");
    });

    it("flags a truncated export and returns exactly the cap", async () => {
      for (let i = 0; i < 3; i++) await prospect({ name: `Lead ${i}` });
      const capped = await exportPipeline(
        db,
        { sorting: [], columnFilters: [] },
        2,
      );
      expect(capped).toMatchObject({ truncated: true, limit: 2 });
      expect(capped.rows).toHaveLength(2);

      const full = await exportPipeline(
        db,
        { sorting: [], columnFilters: [] },
        3,
      );
      expect(full.truncated).toBe(false);
    });

    it("bulk-closes leads with one status_change each and discharges promises", async () => {
      const a = await prospect();
      const b = await prospect();
      await withPromise(a);

      const started = Date.now();
      await expect(
        bulkSetStatus(db, { ids: [a, b, a], status: "lost" }, ACTOR),
      ).resolves.toEqual({ updated: 2 });
      // Timing note for the bulk limit (spec: drop to 50 if p95 > 5 s at 100 ids).
      expect(Date.now() - started).toBeLessThan(5000);

      expect(await leadRow(a)).toMatchObject({
        pipelineStatus: "lost",
        nextActionAt: null,
      });
      const changes = await db
        .select()
        .from(LeadActivitiesTable)
        .where(eq(LeadActivitiesTable.type, "status_change"));
      expect(changes).toHaveLength(2);
    });

    it("bulk-parks through the park path", async () => {
      const id = await prospect();
      await bulkSetStatus(db, { ids: [id], status: "parked" }, ACTOR);
      expect((await leadRow(id)).pipelineStatus).toBe("parked");
    });

    it("rolls the whole batch back when one id is not a prospect", async () => {
      const id = await prospect();
      const [inbound] = await db
        .insert(LeadsTable)
        .values({ kind: "inbound", name: "Contact form" })
        .returning({ id: LeadsTable.id });

      await expect(
        bulkSetStatus(db, { ids: [id, inbound.id], status: "parked" }, ACTOR),
      ).rejects.toMatchObject({ appCode: "SALES_LEAD_NOT_PROSPECT" });
      expect((await leadRow(id)).pipelineStatus).toBe("new");
    });
  });
});
