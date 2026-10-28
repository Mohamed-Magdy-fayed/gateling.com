import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";

import { LeadsTable } from "@/drizzle/schema";
import { connectTestDb, describeWithDb } from "@/test/test-db";

import { SalesError } from "./errors";
import {
  addLocation,
  listLocations,
  removeLocation,
  setPrimaryLocation,
  updateLocation,
} from "./locations";
import type { Db } from "./service";

const SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1!2d31.0112!3d30.5571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f7%3A0x1a2b!2sSASHA!5e0";
const FIELDS = {
  address: null,
  category: null,
  rating: null,
  reviewCount: null,
  embed: null,
};

/** Runs against TEST_DATABASE_URL only (see `src/test/test-db.ts`). */
describeWithDb("lead locations (database)", () => {
  let db: Db;
  let close: () => Promise<void>;
  const ACTOR = "test-actor";

  beforeAll(() => {
    const conn = connectTestDb();
    db = conn.db as unknown as Db;
    close = conn.close;
  });
  afterAll(async () => close());
  beforeEach(async () => {
    await db.delete(LeadsTable);
  });

  async function prospect() {
    const [row] = await db
      .insert(LeadsTable)
      .values({ kind: "prospect", name: "Test Atelier" })
      .returning({ id: LeadsTable.id });
    return row.id;
  }

  async function add(leadId: string, name: string, isPrimary = false) {
    return addLocation(db, { leadId, name, ...FIELDS, isPrimary }, ACTOR);
  }

  it("makes the first location the main one and keeps one main", async () => {
    const leadId = await prospect();
    const main = await add(leadId, "Main");
    const branch = await add(leadId, "Tanta", true);

    const rows = await listLocations(db, leadId);
    expect(rows.map((r) => [r.id, r.isPrimary])).toEqual([
      [branch.id, true],
      [main.id, false],
    ]);
  });

  it("stores only the rebuilt embed src and its coordinates", async () => {
    const leadId = await prospect();
    const { id } = await addLocation(
      db,
      {
        leadId,
        name: "Main",
        ...FIELDS,
        embed: `<iframe src="${SRC}&x=1"></iframe>`,
        isPrimary: false,
      },
      ACTOR,
    );
    const [row] = await listLocations(db, leadId);
    expect(row).toMatchObject({
      id,
      embedSrc: SRC,
      lat: 30.5571,
      lng: 31.0112,
    });

    await updateLocation(db, { id, embed: null }, ACTOR);
    const [cleared] = await listLocations(db, leadId);
    expect(cleared).toMatchObject({ embedSrc: null, lat: null, lng: null });
  });

  it("dates typed Maps numbers", async () => {
    const leadId = await prospect();
    const { id } = await add(leadId, "Main");
    await updateLocation(db, { id, rating: 4.7, reviewCount: 286 }, ACTOR);
    const [row] = await listLocations(db, leadId);
    expect(row.rating).toBeCloseTo(4.7);
    expect(row.checkedAt).toBeInstanceOf(Date);
  });

  it("refuses to remove the main location while branches remain", async () => {
    const leadId = await prospect();
    const main = await add(leadId, "Main");
    const branch = await add(leadId, "Tanta");

    await expect(removeLocation(db, main.id)).rejects.toBeInstanceOf(
      SalesError,
    );

    await setPrimaryLocation(db, branch.id, ACTOR);
    await removeLocation(db, main.id);
    const rows = await listLocations(db, leadId);
    expect(rows.map((r) => [r.id, r.isPrimary])).toEqual([[branch.id, true]]);

    // The last location may go, main or not.
    await removeLocation(db, branch.id);
    expect(await listLocations(db, leadId)).toEqual([]);
  });

  it("rejects locations on unknown leads", async () => {
    await expect(
      add("3f1c2b7e-9a4d-4c1e-8b2a-1d2e3f4a5b6c", "Ghost"),
    ).rejects.toBeInstanceOf(SalesError);
  });
});
