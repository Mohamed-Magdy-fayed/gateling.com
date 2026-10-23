import { describe, expect, it } from "vitest";

import {
  activityFacts,
  bucketDelta,
  derivedChanged,
  planBatches,
  redactDatabaseHost,
} from "./recompute-plan";
import type { TodayBuckets } from "./today-rules";

describe("planBatches", () => {
  it("splits ids into fixed-size batches, keeping order", () => {
    expect(planBatches(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ]);
  });

  it("returns no batches for no ids", () => {
    expect(planBatches([], 50)).toEqual([]);
  });

  it("rejects a non-positive batch size", () => {
    expect(() => planBatches(["a"], 0)).toThrow();
  });
});

function buckets(rows: Partial<Record<string, string[]>>): TodayBuckets {
  const ids = ["rescue", "overdue", "followUp", "newQueue", "autoPark"] as const;
  return {
    buckets: ids.map((id) => ({
      id,
      rows: (rows[id] ?? []).map((leadId) => ({ lead: { id: leadId } })),
      totalBeforeCap: (rows[id] ?? []).length,
    })),
    totalActionable: 0,
  } as unknown as TodayBuckets;
}

describe("bucketDelta", () => {
  it("lists leads entering and leaving each bucket", () => {
    const before = buckets({ autoPark: ["a", "b"], followUp: ["c"] });
    const after = buckets({ followUp: ["c", "a"], autoPark: ["b"] });
    expect(bucketDelta(before, after)).toEqual([
      { bucket: "followUp", entering: ["a"], leaving: [] },
      { bucket: "autoPark", entering: [], leaving: ["a"] },
    ]);
  });

  it("is empty when nothing moves", () => {
    const same = buckets({ overdue: ["a"] });
    expect(bucketDelta(same, same)).toEqual([]);
  });
});

describe("derivedChanged", () => {
  const at = (iso: string) => new Date(iso);
  const stored = {
    lastContactedAt: at("2026-10-01T09:00:00Z"),
    followUpCount: 2,
    nextActionAt: null,
  };

  it("is false for equal values held in different Date instances", () => {
    expect(
      derivedChanged(stored, { ...stored, lastContactedAt: at("2026-10-01T09:00:00Z") }),
    ).toBe(false);
  });

  it("detects a changed count, date or null", () => {
    expect(derivedChanged(stored, { ...stored, followUpCount: 0 })).toBe(true);
    expect(derivedChanged(stored, { ...stored, lastContactedAt: null })).toBe(true);
    expect(
      derivedChanged(stored, { ...stored, nextActionAt: at("2026-10-02T09:00:00Z") }),
    ).toBe(true);
  });
});

describe("activityFacts", () => {
  it("reports a scheduled demo and an inbound reply from the log", () => {
    expect(activityFacts([{ type: "call" }])).toEqual({
      hasDemoScheduledActivity: false,
      hasInboundReply: false,
    });
    expect(
      activityFacts([{ type: "whatsapp_reply" }, { type: "demo_scheduled" }]),
    ).toEqual({ hasDemoScheduledActivity: true, hasInboundReply: true });
  });
});

describe("redactDatabaseHost", () => {
  it("prints only the host, never credentials or the database path", () => {
    expect(
      redactDatabaseHost("postgresql://user:s3cret@ep-cool-1.neon.tech/db?ssl=1"),
    ).toBe("ep-cool-1.neon.tech");
  });

  it("does not echo an unparseable value", () => {
    expect(redactDatabaseHost("not a url")).toBe("(unparseable DATABASE_URL)");
  });
});
