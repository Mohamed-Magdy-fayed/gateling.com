import { drizzle } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";

import * as schema from "@/drizzle/schema";

import { dailyTouchesQuery, sprintScoresQuery } from "./dashboard";

const db = drizzle.mock({ schema });

/**
 * Both aggregates group by an expression holding a bound parameter. Repeating
 * the expression in GROUP BY binds it a second time, and Postgres rejects the
 * query ("must appear in the GROUP BY clause") — which shipped and broke the
 * dashboard. They must group by output position instead.
 */
describe("dashboard aggregates", () => {
  it("groups the sprint scorecard by output position", () => {
    const { sql } = sprintScoresQuery(
      db,
      new Date("2026-10-22T21:00:00Z"),
      new Date("2026-11-05T22:00:00Z"),
    ).toSQL();
    expect(sql).toMatch(/group by 1$/);
  });

  it("groups daily touches by output position", () => {
    const { sql } = dailyTouchesQuery(
      db,
      new Date("2026-10-12T21:00:00Z"),
      "Africa/Cairo",
    ).toSQL();
    expect(sql).toMatch(/group by 1$/);
  });
});
