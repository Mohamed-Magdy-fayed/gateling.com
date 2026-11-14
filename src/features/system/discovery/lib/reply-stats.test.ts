import { describe, expect, it } from "vitest";

import { median, type ReplyStatInput, replyStats } from "./reply-stats";

const at = (minutes: number) =>
  new Date(Date.UTC(2026, 10, 12, 10, 0) + minutes * 60_000);

function row(over: Partial<ReplyStatInput>): ReplyStatInput {
  return {
    direction: "outbound",
    templateId: "t1",
    persona: "personal",
    channel: "facebook",
    occurredAt: at(0),
    repliedAt: null,
    ...over,
  };
}

describe("replyStats", () => {
  it("computes reply rate and median reply time per persona", () => {
    const stats = replyStats([
      row({ persona: "gateling" }),
      row({ persona: "gateling" }),
      row({ persona: "personal", repliedAt: at(30) }),
      row({ persona: "personal", repliedAt: at(90) }),
      row({ persona: "personal" }),
    ]);
    const personal = stats.byPersona.find((s) => s.key === "personal");
    const gateling = stats.byPersona.find((s) => s.key === "gateling");
    expect(personal).toMatchObject({
      sent: 3,
      replied: 2,
      medianReplyMinutes: 60,
    });
    expect(personal?.rate).toBeCloseTo(2 / 3);
    expect(gateling).toMatchObject({
      sent: 2,
      replied: 0,
      rate: 0,
      medianReplyMinutes: null,
    });
  });

  it("ignores inbound rows and rows without a template in the template table", () => {
    const stats = replyStats([
      row({ direction: "inbound" }),
      row({ templateId: null }),
      row({ templateId: "t2", repliedAt: at(5) }),
    ]);
    expect(stats.byTemplate).toEqual([
      { key: "t2", sent: 1, replied: 1, rate: 1, medianReplyMinutes: 5 },
    ]);
    expect(stats.byChannel[0]?.sent).toBe(2);
  });

  it("skips removed touchpoints in every grouping", () => {
    const stats = replyStats([
      row({ repliedAt: at(10) }),
      row({ removedAt: at(60) }),
      row({ repliedAt: at(20), removedAt: at(60), persona: "gateling" }),
    ]);
    expect(stats.byTemplate).toEqual([
      { key: "t1", sent: 1, replied: 1, rate: 1, medianReplyMinutes: 10 },
    ]);
    expect(stats.byPersona.map((s) => s.key)).toEqual(["personal"]);
    expect(stats.byChannel[0]?.sent).toBe(1);
  });

  it("median handles even and empty lists", () => {
    expect(median([])).toBeNull();
    expect(median([10, 20])).toBe(15);
    expect(median([3, 1, 2])).toBe(2);
  });
});
