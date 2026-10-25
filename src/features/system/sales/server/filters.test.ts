import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { buildPipelineWhere, pipelineSortExpr, UNTIERED } from "./filters";

const dialect = new PgDialect();

function render(where: SQL) {
  return dialect.sqlToQuery(where);
}

function whereFor(
  columnFilters: { id: string; value: unknown }[],
  globalFilter?: string,
) {
  return render(
    buildPipelineWhere({ sorting: [], columnFilters, globalFilter }),
  );
}

function orderFor(sorting: { id: string; desc: boolean }[]) {
  return pipelineSortExpr(sorting).map((part) => render(part).sql);
}

describe("buildPipelineWhere", () => {
  it("always scopes to prospects", () => {
    const { sql, params } = whereFor([]);
    expect(sql).toContain('"kind" = $1');
    expect(params).toEqual(["prospect"]);
  });

  it("filters pipeline status by any of the selected values", () => {
    const { sql, params } = whereFor([
      { id: "pipelineStatus", value: ["demo_agreed", "demo_scheduled"] },
    ]);
    expect(sql).toContain('"pipelineStatus" in ($2, $3)');
    expect(params).toContain("demo_agreed");
  });

  it("drops status values that are not real statuses", () => {
    const { sql, params } = whereFor([
      { id: "pipelineStatus", value: ["won", "'; drop table leads"] },
    ]);
    expect(sql).toContain('"pipelineStatus" in ($2)');
    expect(params).toEqual(["prospect", "won"]);
  });

  it("matches untiered leads alongside picked tiers", () => {
    const { sql } = whereFor([{ id: "tier", value: ["A", UNTIERED] }]);
    expect(sql).toContain('"tier" in ($2)');
    expect(sql).toContain('"tier" is null');
    expect(sql).toMatch(/\(.*"tier" in .* or .*"tier" is null.*\)/);
  });

  it("filters untiered alone without an empty in-list", () => {
    const { sql } = whereFor([{ id: "tier", value: [UNTIERED] }]);
    expect(sql).toContain('"tier" is null');
    expect(sql).not.toContain('"tier" in');
  });

  it("filters WhatsApp status", () => {
    const { params } = whereFor([
      { id: "whatsappStatus", value: ["confirmed"] },
    ]);
    expect(params).toContain("confirmed");
  });

  it("filters do-not-contact only when exactly one side is picked", () => {
    expect(whereFor([{ id: "doNotContact", value: ["true"] }]).sql).toContain(
      '"doNotContact" = $2',
    );
    expect(
      whereFor([{ id: "doNotContact", value: ["true", "false"] }]).sql,
    ).not.toContain("doNotContact");
  });

  it("matches city and business type as sanitized partial text", () => {
    const { sql, params } = whereFor([
      { id: "city", value: "Maa%di_" },
      { id: "businessType", value: "distributor" },
    ]);
    expect(sql).toContain('"city" ilike $2');
    expect(sql).toContain('"businessType" ilike $3');
    expect(params).toEqual(["prospect", "%Maadi%", "%distributor%"]);
  });

  it("ignores a text filter that sanitizes to nothing", () => {
    expect(whereFor([{ id: "city", value: "%_\\" }]).params).toEqual([
      "prospect",
    ]);
  });

  it("bounds follow-ups by a number range", () => {
    const { sql, params } = whereFor([
      { id: "followUpCount", value: { min: 1, max: 2 } },
    ]);
    expect(sql).toContain('"followUpCount" >= $2');
    expect(sql).toContain('"followUpCount" <= $3');
    expect(params).toEqual(["prospect", 1, 2]);
  });

  it("bounds date columns with wire timestamps", () => {
    const { sql, params } = whereFor([
      {
        id: "lastContactedAt",
        value: {
          from: "2026-10-01T00:00:00.000Z",
          to: "2026-10-07T21:59:59.999Z",
        },
      },
      { id: "nextActionAt", value: { to: "2026-10-24T21:59:59.999Z" } },
      { id: "createdAt", value: { from: "2026-09-01T00:00:00.000Z" } },
    ]);
    expect(sql).toContain('"lastContactedAt" >= $2');
    expect(sql).toContain('"lastContactedAt" <= $3');
    expect(sql).toContain('"nextActionAt" <= $4');
    expect(sql).toContain('"createdAt" >= $5');
    // The timestamp column serialises the parsed Date back to ISO.
    expect(params[1]).toBe("2026-10-01T00:00:00.000Z");
  });

  it("ignores unknown filter ids and malformed values", () => {
    const { params } = whereFor([
      { id: "ipAddress", value: "1.2.3.4" },
      { id: "followUpCount", value: "lots" },
      { id: "createdAt", value: 42 },
    ]);
    expect(params).toEqual(["prospect"]);
  });

  it("skips unparseable dates and non-finite numbers instead of failing", () => {
    const { params } = whereFor([
      { id: "createdAt", value: { from: "xT", to: "not-a-date" } },
      { id: "followUpCount", value: { min: Number.NaN, max: Infinity } },
    ]);
    expect(params).toEqual(["prospect"]);
  });

  it("dedupes and caps facet values before binding them", () => {
    const { params } = whereFor([
      { id: "pipelineStatus", value: Array(100_000).fill("new") },
    ]);
    expect(params).toEqual(["prospect", "new"]);
  });

  it("searches every contact field with a sanitized fragment", () => {
    const { sql, params } = whereFor([], " 0100_%123 ");
    for (const column of [
      "name",
      "nameAr",
      "phone",
      "phoneSecondary",
      "city",
      "area",
      "whatsappProfileName",
    ]) {
      expect(sql).toContain(`"${column}" ilike`);
    }
    expect(params).toContain("%0100123%");
  });

  it("skips a search that sanitizes to nothing", () => {
    expect(whereFor([], "%%").sql).not.toContain("ilike");
  });
});

describe("pipelineSortExpr", () => {
  it("defaults to newest first", () => {
    const [first] = orderFor([]);
    expect(first).toContain('"createdAt" desc');
  });

  it("falls back to newest first for an unknown sort id", () => {
    expect(orderFor([{ id: "ip_address; drop", desc: false }])[0]).toContain(
      '"createdAt" desc',
    );
  });

  it("ignores sort ids that name prototype properties", () => {
    for (const id of ["constructor", "__proto__", "toString"]) {
      expect(orderFor([{ id, desc: true }])[0]).toContain('"createdAt" desc');
    }
  });

  it("sorts a whitelisted column in the requested direction", () => {
    expect(orderFor([{ id: "name", desc: false }])[0]).toContain('"name" asc');
    expect(orderFor([{ id: "businessType", desc: true }])[0]).toContain(
      '"businessType" desc',
    );
  });

  it("puts empty timestamps and follower counts last in both directions", () => {
    for (const id of ["lastContactedAt", "nextActionAt", "socialFollowers"]) {
      expect(orderFor([{ id, desc: true }])[0]).toMatch(/desc nulls last$/);
      expect(orderFor([{ id, desc: false }])[0]).toMatch(/asc nulls last$/);
    }
  });

  it("breaks ties by id so paging is stable", () => {
    const parts = orderFor([{ id: "tier", desc: false }]);
    expect(parts.at(-1)).toContain('"id" asc');
  });
});
