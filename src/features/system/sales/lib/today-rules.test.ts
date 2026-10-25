import { describe, expect, it } from "vitest";

import {
  bucketById,
  computeTodayBuckets,
  DEFAULT_TODAY_RULES_CONFIG,
  type TodayLeadInput,
} from "./today-rules";

/**
 * Every test pins `now` so the day thresholds can be probed at their exact
 * boundary. These are the numbers that get tuned, so "2 days" vs "just over
 * 2 days" is the behaviour worth locking down.
 */
const NOW = new Date("2026-08-17T12:00:00.000Z");
const HOUR = 3_600_000;
const DAY = 86_400_000;

function daysAgo(days: number, extraMs = 0): Date {
  return new Date(NOW.getTime() - days * DAY - extraMs);
}

function lead(overrides: Partial<TodayLeadInput> = {}): TodayLeadInput {
  return {
    id: "lead-1",
    name: "Test Atelier",
    nameAr: null,
    city: "Cairo",
    area: "Nasr City",
    phone: "+20 10 0000 0000",
    phoneSecondary: null,
    whatsappStatus: "unknown",
    whatsappProfileName: null,
    tier: "B",
    socialFollowers: null,
    socialPlatform: null,
    socialHandle: null,
    address: null,
    socialProfiles: {},
    pipelineStatus: "new",
    doNotContact: false,
    notes: null,
    lastContactedAt: null,
    followUpCount: 0,
    nextActionAt: null,
    hasDemoScheduledActivity: false,
    hasInboundReply: false,
    ...overrides,
  };
}

function idsIn(
  leads: TodayLeadInput[],
  bucket: Parameters<typeof bucketById>[1],
) {
  return bucketById(computeTodayBuckets(leads, NOW), bucket).rows.map(
    (row) => row.lead.id,
  );
}

describe("rescue bucket — the 2-day threshold", () => {
  const demoAgreed = (lastContactedAt: Date | null) =>
    lead({ id: "r", pipelineStatus: "demo_agreed", lastContactedAt });

  it("excludes a demo_agreed lead contacted 1 day ago", () => {
    expect(idsIn([demoAgreed(daysAgo(1))], "rescue")).toEqual([]);
  });

  it("excludes a demo_agreed lead contacted exactly 2 days ago", () => {
    expect(idsIn([demoAgreed(daysAgo(2))], "rescue")).toEqual([]);
  });

  it("includes a demo_agreed lead contacted just over 2 days ago", () => {
    expect(idsIn([demoAgreed(daysAgo(2, HOUR))], "rescue")).toEqual(["r"]);
  });

  it("includes a demo_agreed lead that was never contacted", () => {
    expect(idsIn([demoAgreed(null)], "rescue")).toEqual(["r"]);
  });

  it("excludes a stale demo_agreed lead once a demo is scheduled", () => {
    const scheduled = lead({
      id: "r",
      pipelineStatus: "demo_agreed",
      lastContactedAt: daysAgo(9),
      hasDemoScheduledActivity: true,
    });
    expect(idsIn([scheduled], "rescue")).toEqual([]);
  });
});

describe("overdue bucket", () => {
  it("excludes a promise due in the future", () => {
    const future = lead({
      id: "o",
      nextActionAt: new Date(NOW.getTime() + HOUR),
    });
    expect(idsIn([future], "overdue")).toEqual([]);
  });

  it("includes a promise whose time has passed", () => {
    const past = lead({ id: "o", nextActionAt: daysAgo(1) });
    expect(idsIn([past], "overdue")).toEqual(["o"]);
  });

  it("reports how many days overdue", () => {
    const past = lead({ id: "o", nextActionAt: daysAgo(3) });
    const [row] = bucketById(computeTodayBuckets([past], NOW), "overdue").rows;
    expect(row.reason).toEqual({ kind: "overdue", daysOverdue: 3 });
  });

  it("excludes a fulfilled promise (service clears nextActionAt)", () => {
    // `nextActionAt` is the earliest *unfulfilled* promise; once discharged the
    // recompute leaves it null, so the lead drops out of the bucket.
    const fulfilled = lead({ id: "o", nextActionAt: null });
    expect(idsIn([fulfilled], "overdue")).toEqual([]);
  });
});

describe("follow-up bucket — the 3-day threshold", () => {
  const awaiting = (lastContactedAt: Date | null, followUpCount = 1) =>
    lead({
      id: "f",
      pipelineStatus: "awaiting_reply",
      lastContactedAt,
      followUpCount,
    });

  it("excludes a lead contacted 2 days ago", () => {
    expect(idsIn([awaiting(daysAgo(2))], "followUp")).toEqual([]);
  });

  it("excludes a lead contacted exactly 3 days ago", () => {
    expect(idsIn([awaiting(daysAgo(3))], "followUp")).toEqual([]);
  });

  it("includes a lead contacted just over 3 days ago", () => {
    expect(idsIn([awaiting(daysAgo(3, HOUR))], "followUp")).toEqual(["f"]);
  });
});

describe("followUpCount >= 2 cutoff", () => {
  const chased = (followUpCount: number) =>
    lead({
      id: "c",
      pipelineStatus: "awaiting_reply",
      lastContactedAt: daysAgo(9),
      followUpCount,
    });

  it("treats one unanswered attempt as still due for follow-up", () => {
    expect(idsIn([chased(1)], "followUp")).toEqual(["c"]);
    expect(idsIn([chased(1)], "autoPark")).toEqual([]);
  });

  it("moves a lead to auto-park at exactly two unanswered attempts", () => {
    expect(idsIn([chased(2)], "followUp")).toEqual([]);
    expect(idsIn([chased(2)], "autoPark")).toEqual(["c"]);
  });

  it("keeps chasing out of auto-park once a reply has arrived", () => {
    const replied = lead({
      id: "c",
      pipelineStatus: "awaiting_reply",
      lastContactedAt: daysAgo(9),
      followUpCount: 3,
      hasInboundReply: true,
    });
    expect(idsIn([replied], "autoPark")).toEqual([]);
  });
});

describe("hard exclusions", () => {
  it("never shows a doNotContact lead in any bucket", () => {
    const blocked = lead({
      id: "x",
      doNotContact: true,
      pipelineStatus: "demo_agreed",
      lastContactedAt: daysAgo(9),
      followUpCount: 5,
    });
    expect(computeTodayBuckets([blocked], NOW).totalActionable).toBe(0);
  });

  it("never shows a parked lead in any bucket", () => {
    const parked = lead({
      id: "x",
      pipelineStatus: "parked",
      lastContactedAt: daysAgo(9),
      followUpCount: 5,
    });
    expect(computeTodayBuckets([parked], NOW).totalActionable).toBe(0);
  });

  // A closed lead chased twice used to surface in Auto-park, offering to park
  // a lead that was already lost or won.
  it.each(["lost", "won", "blocked_no_number"] as const)(
    "never shows a %s lead in any bucket, Auto-park included",
    (pipelineStatus) => {
      const closed = lead({
        id: "x",
        pipelineStatus,
        lastContactedAt: daysAgo(9),
        followUpCount: 3,
        nextActionAt: daysAgo(1),
      });
      const result = computeTodayBuckets([closed], NOW);
      expect(result.buckets.flatMap((bucket) => bucket.rows)).toEqual([]);
    },
  );

  it("keeps blocked_no_number out of the new queue", () => {
    const noNumber = lead({
      id: "x",
      pipelineStatus: "blocked_no_number",
      phone: null,
    });
    expect(idsIn([noNumber], "newQueue")).toEqual([]);
  });

  it("keeps a new lead with no phone out of the new queue", () => {
    expect(idsIn([lead({ id: "x", phone: null })], "newQueue")).toEqual([]);
    expect(idsIn([lead({ id: "y", phone: "   " })], "newQueue")).toEqual([]);
  });
});

describe("new queue ordering and cap", () => {
  it("orders by tier, then followers descending", () => {
    const leads = [
      lead({ id: "b-small", tier: "B", socialFollowers: 100 }),
      lead({ id: "a-big", tier: "A", socialFollowers: 331_000 }),
      lead({ id: "c", tier: "C", socialFollowers: 999_999 }),
      lead({ id: "a-small", tier: "A", socialFollowers: 5_000 }),
      lead({ id: "untiered", tier: null, socialFollowers: 1_000_000 }),
    ];
    expect(idsIn(leads, "newQueue")).toEqual([
      "a-big",
      "a-small",
      "b-small",
      "c",
      "untiered",
    ]);
  });

  it("caps the queue at the configured number", () => {
    const leads = Array.from({ length: 25 }, (_, i) =>
      lead({ id: `n${i}`, socialFollowers: 25 - i }),
    );
    const bucket = bucketById(computeTodayBuckets(leads, NOW), "newQueue");
    expect(bucket.rows).toHaveLength(DEFAULT_TODAY_RULES_CONFIG.newQueueCap);
    expect(bucket.totalBeforeCap).toBe(25);
  });

  it("honours a custom cap", () => {
    const leads = Array.from({ length: 8 }, (_, i) => lead({ id: `n${i}` }));
    const bucket = bucketById(
      computeTodayBuckets(leads, NOW, {
        ...DEFAULT_TODAY_RULES_CONFIG,
        newQueueCap: 3,
      }),
      "newQueue",
    );
    expect(bucket.rows).toHaveLength(3);
    expect(bucket.totalBeforeCap).toBe(8);
  });
});

describe("bucket priority", () => {
  it("puts a lead matching both rescue and overdue in rescue only", () => {
    const both = lead({
      id: "p",
      pipelineStatus: "demo_agreed",
      lastContactedAt: daysAgo(5),
      nextActionAt: daysAgo(1),
    });
    expect(idsIn([both], "rescue")).toEqual(["p"]);
    expect(idsIn([both], "overdue")).toEqual([]);
    expect(computeTodayBuckets([both], NOW).totalActionable).toBe(1);
  });

  it("puts a lead matching both overdue and follow-up in overdue only", () => {
    const both = lead({
      id: "p",
      pipelineStatus: "awaiting_reply",
      lastContactedAt: daysAgo(5),
      followUpCount: 1,
      nextActionAt: daysAgo(1),
    });
    expect(idsIn([both], "overdue")).toEqual(["p"]);
    expect(idsIn([both], "followUp")).toEqual([]);
  });

  it("returns buckets in the fixed display order", () => {
    expect(computeTodayBuckets([], NOW).buckets.map((b) => b.id)).toEqual([
      "rescue",
      "overdue",
      "followUp",
      "newQueue",
      "autoPark",
    ]);
  });
});

describe("row presentation data", () => {
  it("uses the first non-empty note line as the opening angle", () => {
    const withNotes = lead({
      id: "n",
      notes: "\n  Multi-city chain: highest-value target.\nSecond line.",
    });
    const [row] = bucketById(
      computeTodayBuckets([withNotes], NOW),
      "newQueue",
    ).rows;
    expect(row.openingAngle).toBe("Multi-city chain: highest-value target.");
  });

  it("reports null opening angle and null days when there is nothing to show", () => {
    const [row] = bucketById(
      computeTodayBuckets([lead({ id: "n" })], NOW),
      "newQueue",
    ).rows;
    expect(row.openingAngle).toBeNull();
    expect(row.daysSinceLastContact).toBeNull();
  });
});

describe("the seeded CSV shape reproduces the expected counts", () => {
  // Mirrors leads-seed.csv: 2 demo_agreed never scheduled, 1 callback with an
  // overdue promise, 7 awaiting_reply at one follow-up — all dated 2026-08-10.
  const seededAt = new Date("2026-08-10T00:00:00.000Z");

  const seeded: TodayLeadInput[] = [
    ...["So Dress Atelier", "May Allam Couture"].map((name) =>
      lead({
        id: name,
        name,
        pipelineStatus: "demo_agreed",
        lastContactedAt: seededAt,
      }),
    ),
    lead({
      id: "Atelier High Class",
      pipelineStatus: "callback_scheduled",
      lastContactedAt: seededAt,
      nextActionAt: new Date("2026-08-11T00:00:00.000Z"),
    }),
    ...[
      "Princess Dress",
      "Atelier Farida",
      "Hatgawez",
      "Atelier Sama",
      "Atelier El-Malaka",
      "Mary's Bridal",
      "Atelier Yasmina",
    ].map((name) =>
      lead({
        id: name,
        name,
        pipelineStatus: "awaiting_reply",
        lastContactedAt: seededAt,
        followUpCount: 1,
      }),
    ),
  ];

  it("yields 2 rescue, 1 overdue, 7 follow-up", () => {
    const result = computeTodayBuckets(seeded, NOW);
    expect(bucketById(result, "rescue").rows).toHaveLength(2);
    expect(bucketById(result, "overdue").rows).toHaveLength(1);
    expect(bucketById(result, "followUp").rows).toHaveLength(7);
  });
});

/**
 * Today is frozen per business day: everything is judged as of the local day
 * start, and a lead contacted today is done for the day. Without this the list
 * grew while it was being worked — leads crossed a threshold mid-afternoon and
 * a lead chased a second time dropped straight into Auto-park.
 */
describe("frozen per business day", () => {
  /** Cairo midnight before NOW (12:00Z) — 15 hours earlier. */
  const DAY_START = new Date("2026-08-16T21:00:00.000Z");

  function bucketsOf(leads: TodayLeadInput[]) {
    return computeTodayBuckets(leads, NOW, DEFAULT_TODAY_RULES_CONFIG, DAY_START);
  }

  it("does not move a lead chased for the second time today into Auto-park", () => {
    const chased = lead({
      pipelineStatus: "awaiting_reply",
      lastContactedAt: new Date(NOW.getTime() - HOUR),
      followUpCount: 2,
    });
    expect(bucketsOf([chased]).totalActionable).toBe(0);
  });

  it("does not resurface any lead contacted earlier today", () => {
    const contactedToday = new Date(DAY_START.getTime() + HOUR);
    const leads = [
      lead({ id: "rescue", pipelineStatus: "demo_agreed", lastContactedAt: contactedToday }),
      lead({ id: "new", pipelineStatus: "new", lastContactedAt: contactedToday }),
      lead({ id: "park", pipelineStatus: "awaiting_reply", lastContactedAt: contactedToday, followUpCount: 3 }),
    ];
    expect(bucketsOf(leads).totalActionable).toBe(0);
  });

  it("does not add a follow-up that only goes stale during the day", () => {
    // Stale against NOW (3 days + 1h), not yet stale at the day start.
    const goesStaleToday = lead({
      pipelineStatus: "awaiting_reply",
      lastContactedAt: daysAgo(3, HOUR),
      followUpCount: 1,
    });
    expect(bucketById(bucketsOf([goesStaleToday]), "followUp").rows).toHaveLength(0);
  });

  it("keeps a follow-up that was already stale when the day started", () => {
    const staleAtDayStart = lead({
      pipelineStatus: "awaiting_reply",
      lastContactedAt: new Date(DAY_START.getTime() - 3 * DAY - HOUR),
      followUpCount: 1,
    });
    const [row] = bucketById(bucketsOf([staleAtDayStart]), "followUp").rows;
    // Days since contact is still told against the current time.
    expect(row.daysSinceLastContact).toBe(3);
  });

  it("still shows a callback promised for later today once it is due", () => {
    const callback = lead({
      pipelineStatus: "callback_scheduled",
      lastContactedAt: new Date(DAY_START.getTime() + HOUR),
      nextActionAt: new Date(NOW.getTime() - HOUR),
    });
    expect(bucketById(bucketsOf([callback]), "overdue").rows).toHaveLength(1);
  });

  it("judges against the current time when no day start is given", () => {
    const goesStaleToday = lead({
      pipelineStatus: "awaiting_reply",
      lastContactedAt: daysAgo(3, HOUR),
      followUpCount: 1,
    });
    expect(bucketById(computeTodayBuckets([goesStaleToday], NOW), "followUp").rows).toHaveLength(1);
  });
});
