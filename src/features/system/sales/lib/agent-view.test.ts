import { describe, expect, it } from "vitest";

import type { TodayWorkSummary } from "../server/schemas";
import { agentToday } from "./agent-view";
import type { TodayBucketId, TodayLeadInput, TodayRow } from "./today-rules";

function lead(id: string, extra: Partial<TodayLeadInput> = {}): TodayLeadInput {
  return {
    id,
    name: `Atelier ${id}`,
    nameAr: null,
    city: "Cairo",
    area: null,
    phone: "01001234567",
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
    ...extra,
  };
}

function summary(
  rows: Partial<Record<TodayBucketId, TodayLeadInput[]>>,
  extra: Partial<TodayWorkSummary> = {},
): TodayWorkSummary {
  const ids: TodayBucketId[] = ["rescue", "overdue", "followUp", "newQueue", "autoPark"];
  const buckets = ids.map((id) => ({
    id,
    rows: (rows[id] ?? []).map(
      (l): TodayRow => ({
        lead: l,
        reason: { kind: "newQueue", tier: l.tier, followers: l.socialFollowers },
        daysSinceLastContact: null,
        openingAngle: null,
      }),
    ),
    totalBeforeCap: (rows[id] ?? []).length,
  }));
  return {
    buckets,
    totalActionable: buckets.reduce((n, b) => n + b.rows.length, 0),
    doneToday: 0,
    conversationsToday: 0,
    demosBookedToday: 0,
    newTouchedToday: 0,
    dueTomorrow: 0,
    hasProspects: true,
    timeZone: "Africa/Cairo",
    newQueueCap: 10,
    now: new Date("2026-10-24T09:00:00Z"),
    ...extra,
  } as TodayWorkSummary;
}

describe("agentToday", () => {
  it("lists work in priority order with the bucket's primary action", () => {
    const today = agentToday(
      summary({
        followUp: [lead("f", { whatsappStatus: "confirmed" })],
        rescue: [lead("r")],
      }),
    );
    expect(today.work.map((w) => [w.leadId, w.bucket, w.primaryAction])).toEqual([
      ["r", "rescue", "call"],
      ["f", "followUp", "whatsapp"],
    ]);
  });

  it("offers both channels' outcomes outside Auto-park", () => {
    const [item] = agentToday(summary({ overdue: [lead("o")] })).work;
    expect(item?.outcomes).toEqual([
      "interested",
      "bookDemo",
      "callBack",
      "noAnswer",
      "notInterested",
      "wrongNumber",
      "whatsappSent",
      "whatsappReplied",
    ]);
  });

  // The follow-up limit protects the WhatsApp number from a ban.
  it("offers no outbound outcome in Auto-park", () => {
    const [item] = agentToday(summary({ autoPark: [lead("a")] })).work;
    expect(item?.primaryAction).toBe("park");
    expect(item?.outcomes).toEqual(["park", "theyReplied", "answeredCall"]);
  });

  it("flags new leads beyond today's goal", () => {
    const today = agentToday(
      summary(
        { newQueue: [lead("n1"), lead("n2"), lead("n3")] },
        { newQueueCap: 10, newTouchedToday: 8 },
      ),
    );
    expect(today.work.map((w) => [w.leadId, w.beyondDailyGoal])).toEqual([
      ["n1", false],
      ["n2", false],
      ["n3", true],
    ]);
  });

  it("includes a WhatsApp link and the day's progress", () => {
    const today = agentToday(
      summary({ rescue: [lead("r")] }, { doneToday: 3, conversationsToday: 1, dueTomorrow: 2 }),
    );
    expect(today.work[0]?.whatsappUrl).toMatch(/^https:\/\/wa\.me\//);
    expect(today.progress).toEqual({
      doneToday: 3,
      conversationsToday: 1,
      demosBookedToday: 0,
      newTouchedToday: 0,
      newQueueCap: 10,
      dueTomorrow: 2,
    });
    expect(today.date).toBe("2026-10-24");
  });
});
