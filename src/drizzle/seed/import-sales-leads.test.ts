import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { computeDerived } from "@/features/system/sales/lib/derived";
import {
  bucketById,
  computeTodayBuckets,
  type TodayLeadInput,
} from "@/features/system/sales/lib/today-rules";

import { DEFAULT_CSV_PATH, mapRecord, parseCsv } from "./sales-csv";

/**
 * Parser and mapping correctness, plus the acceptance check from the brief:
 * the seeded CSV must yield 2 Rescue, 1 Overdue and 7 Follow-up on first load.
 *
 * This runs the *real* `mapRecord` and `computeDerived` rather than a copy of
 * them, so a mapping regression fails here instead of after a production
 * import.
 */

describe("parseCsv", () => {
  it("handles quoted fields containing commas", () => {
    expect(parseCsv('a,b\n1,"x, y"\n')).toEqual([{ a: "1", b: "x, y" }]);
  });

  it("strips a UTF-8 BOM from the first header", () => {
    expect(parseCsv("﻿name,city\nAcme,Cairo\n")[0].name).toBe("Acme");
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"He said ""hi"""\n')[0].a).toBe('He said "hi"');
  });

  it("reads a final row with no trailing newline", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([{ a: "1", b: "2" }]);
  });

  it("keeps a quoted newline inside one field", () => {
    const rows = parseCsv('a,b\n1,"line one\nline two"\n');
    expect(rows).toHaveLength(1);
    expect(rows[0].b).toBe("line one\nline two");
  });
});

describe("mapRecord", () => {
  it("skips a row with no business name", () => {
    expect(mapRecord({ name: "  " })).toBeNull();
  });

  it("derives a promised callback for callback_scheduled leads only", () => {
    const scheduled = mapRecord({
      name: "A",
      status: "callback_scheduled",
      last_activity_type: "call",
      last_activity_date: "2026-08-10",
    });
    expect(scheduled?.activity?.nextActionAt).toEqual(
      new Date("2026-08-11T12:00:00.000Z"),
    );

    const awaiting = mapRecord({
      name: "B",
      status: "awaiting_reply",
      last_activity_type: "whatsapp_sent",
      last_activity_date: "2026-08-10",
    });
    expect(awaiting?.activity?.nextActionAt).toBeNull();
  });

  it("stores phone numbers exactly as entered", () => {
    const mapped = mapRecord({ name: "A", phone_primary: "+20 10 6492 0648" });
    expect(mapped?.lead.phone).toBe("+20 10 6492 0648");
  });

  it("parses follower counts and treats blank tier as untiered", () => {
    const mapped = mapRecord({
      name: "A",
      social_followers: "331000",
      tier: "",
    });
    expect(mapped?.lead.socialFollowers).toBe(331_000);
    expect(mapped?.lead.tier).toBeNull();
  });

  it("reads do_not_contact as a boolean", () => {
    expect(
      mapRecord({ name: "A", do_not_contact: "true" })?.lead.doNotContact,
    ).toBe(true);
    expect(
      mapRecord({ name: "A", do_not_contact: "false" })?.lead.doNotContact,
    ).toBe(false);
  });
});

// The CSV lives outside the repo, so skip rather than fail on a machine that
// does not have that drive mounted.
const describeCsv = existsSync(DEFAULT_CSV_PATH) ? describe : describe.skip;

describeCsv("leads-seed.csv acceptance counts", () => {
  const records = parseCsv(readFileSync(DEFAULT_CSV_PATH, "utf8"));

  /**
   * Reproduces exactly what a fresh import produces: the mapped lead columns
   * plus the derived values the service computes from the single seeded
   * activity.
   */
  const seeded: TodayLeadInput[] = records.flatMap((record) => {
    const mapped = mapRecord(record);
    if (!mapped) return [];

    const activities = mapped.activity
      ? [{ ...mapped.activity, nextActionDoneAt: null }]
      : [];
    const derived = computeDerived(activities);

    return [
      {
        id: mapped.lead.name,
        name: mapped.lead.name,
        nameAr: null,
        city: mapped.lead.city,
        area: mapped.lead.area,
        phone: mapped.lead.phone,
        phoneSecondary: mapped.lead.phoneSecondary,
        whatsappStatus: mapped.lead.whatsappStatus,
        whatsappProfileName: mapped.lead.whatsappProfileName,
        tier: mapped.lead.tier,
        socialFollowers: mapped.lead.socialFollowers,
        pipelineStatus: mapped.lead.pipelineStatus,
        doNotContact: mapped.lead.doNotContact,
        notes: mapped.lead.notes,
        lastContactedAt: derived.lastContactedAt,
        followUpCount: derived.followUpCount,
        nextActionAt: derived.nextActionAt,
        hasDemoScheduledActivity: activities.some(
          (a) => a.type === "demo_scheduled",
        ),
        hasInboundReply: activities.some((a) => a.type === "whatsapp_reply"),
      },
    ];
  });

  // Any date safely past the 3-day follow-up threshold from 2026-08-10.
  const NOW = new Date("2026-08-17T12:00:00.000Z");

  it("contains 44 prospects", () => {
    expect(seeded).toHaveLength(44);
  });

  it("yields 2 Rescue, 1 Overdue and 7 Follow-up", () => {
    const result = computeTodayBuckets(seeded, NOW);

    expect(bucketById(result, "rescue").rows).toHaveLength(2);
    expect(bucketById(result, "overdue").rows).toHaveLength(1);
    expect(bucketById(result, "followUp").rows).toHaveLength(7);
  });

  it("names the expected leads in each bucket", () => {
    const result = computeTodayBuckets(seeded, NOW);

    expect(bucketById(result, "rescue").rows.map((r) => r.lead.name)).toEqual([
      "So Dress Atelier",
      "May Allam Couture (اتيليه مى علام)",
    ]);
    expect(bucketById(result, "overdue").rows.map((r) => r.lead.name)).toEqual([
      "Atelier High Class (أتيلية هاي كلاس)",
    ]);
  });

  it("caps the new queue at 10, led by the largest tier-A business", () => {
    const newQueue = bucketById(computeTodayBuckets(seeded, NOW), "newQueue");

    expect(newQueue.rows).toHaveLength(10);
    expect(newQueue.totalBeforeCap).toBeGreaterThan(10);
    expect(newQueue.rows[0].lead.name).toBe("Maxim Wedding Dress Cairo");
  });

  it("keeps do-not-contact and no-number leads out of every bucket", () => {
    const result = computeTodayBuckets(seeded, NOW);
    const shown = result.buckets.flatMap((bucket) =>
      bucket.rows.map((row) => row.lead),
    );

    expect(shown.every((lead) => !lead.doNotContact)).toBe(true);
    expect(
      shown.every((lead) => lead.pipelineStatus !== "blocked_no_number"),
    ).toBe(true);
  });
});
