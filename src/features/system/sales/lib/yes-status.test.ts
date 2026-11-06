import { describe, expect, it } from "vitest";

import { statusEffectForTick } from "./yes-status";

describe("statusEffectForTick", () => {
  it("asks for a demo time when Demo booked is ticked before a demo exists", () => {
    expect(statusEffectForTick("demo", "yes", "contacted")).toEqual({
      kind: "bookDemo",
    });
    expect(statusEffectForTick("demo", "yes", "demo_agreed")).toEqual({
      kind: "bookDemo",
    });
  });

  it("never moves a lead back", () => {
    expect(statusEffectForTick("demo", "yes", "demo_done")).toEqual({
      kind: "none",
    });
    expect(statusEffectForTick("trial", "yes", "won")).toEqual({
      kind: "none",
    });
  });

  it("moves to demo_done on Free trial and to won on Subscribes", () => {
    expect(statusEffectForTick("trial", "yes", "demo_scheduled")).toEqual({
      kind: "advance",
      to: "demo_done",
    });
    expect(statusEffectForTick("subscribe", "yes", "demo_done")).toEqual({
      kind: "advance",
      to: "won",
    });
  });

  it("reopens a closed lead on a yes", () => {
    expect(statusEffectForTick("subscribe", "yes", "lost")).toEqual({
      kind: "advance",
      to: "won",
    });
  });

  it("changes nothing for steps 1-3 and referrals", () => {
    for (const step of [
      "callTime",
      "shareProblems",
      "watchVideo",
      "referrals",
    ] as const) {
      expect(statusEffectForTick(step, "yes", "new")).toEqual({
        kind: "none",
      });
    }
  });

  it("offers to close an open lead on a no, but not a closed or won one", () => {
    expect(statusEffectForTick("callTime", "no", "new")).toEqual({
      kind: "offerLost",
    });
    expect(statusEffectForTick("demo", "no", "demo_agreed")).toEqual({
      kind: "offerLost",
    });
    expect(statusEffectForTick("demo", "no", "lost")).toEqual({
      kind: "none",
    });
    expect(statusEffectForTick("referrals", "no", "won")).toEqual({
      kind: "none",
    });
  });

  it("does nothing when a tick is cleared", () => {
    expect(statusEffectForTick("subscribe", null, "demo_done")).toEqual({
      kind: "none",
    });
  });
});
