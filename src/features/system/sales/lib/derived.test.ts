import { describe, expect, it } from "vitest";

import { computeDerived, type DerivedActivityInput } from "./derived";

const T0 = new Date("2026-10-01T09:00:00.000Z").getTime();
const HOUR = 3_600_000;

/** Activities one hour apart, in the order given. */
function log(...types: string[]): DerivedActivityInput[] {
  return types.map((type, i) => ({
    type,
    occurredAt: new Date(T0 + i * HOUR),
    nextActionAt: null,
    nextActionDoneAt: null,
  }));
}

const followUps = (...types: string[]) =>
  computeDerived(log(...types)).followUpCount;

describe("followUpCount — outbound attempts since the last conversation", () => {
  it("counts unanswered outbound attempts", () => {
    expect(followUps("whatsapp_sent")).toBe(1);
    expect(followUps("no_answer", "no_answer")).toBe(2);
    expect(followUps("whatsapp_sent", "call_unclear")).toBe(2);
  });

  // An answered call is a conversation: counting it as a chase pushed leads
  // you actually spoke to into Auto-park.
  it.each(["call", "whatsapp_reply", "demo_agreed", "demo_scheduled", "demo_done"])(
    "resets after a %s",
    (conversation) => {
      expect(followUps("no_answer", "whatsapp_sent", conversation)).toBe(0);
    },
  );

  it("counts again from the conversation onward", () => {
    expect(followUps("no_answer", "call", "no_answer")).toBe(1);
  });

  it("ignores notes and status changes", () => {
    expect(followUps("no_answer", "note", "status_change")).toBe(1);
  });
});

describe("lastContactedAt", () => {
  it("is the latest contact activity, attempts included", () => {
    const activities = log("call", "no_answer", "note");
    expect(computeDerived(activities).lastContactedAt).toEqual(
      activities[1]?.occurredAt,
    );
  });
});
