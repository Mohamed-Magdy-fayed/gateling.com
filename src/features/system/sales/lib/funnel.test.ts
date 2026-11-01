import { describe, expect, it } from "vitest";

import {
  type FunnelInput,
  funnelFactsFromActivities,
  funnelPositionFor,
  isVideoSentOutcome,
  VIDEO_SENT_OUTCOME,
} from "./funnel";

const DAY = 86_400_000;
const t0 = new Date("2026-11-01T09:00:00Z");

function input(overrides: Partial<FunnelInput> = {}): FunnelInput {
  return {
    pipelineStatus: "new",
    followUpCount: 0,
    lastContactedAt: null,
    nextActionAt: null,
    hasVideoSent: false,
    lastDemoDoneAt: null,
    ...overrides,
  };
}

describe("funnelPositionFor", () => {
  it("starts a new lead in discovery", () => {
    expect(funnelPositionFor(input())).toEqual({
      stage: "discovery",
      step: { id: "startDiscovery" },
    });
  });

  it("waits for the discovery reply and dates the one follow-up", () => {
    const position = funnelPositionFor(
      input({
        pipelineStatus: "awaiting_reply",
        followUpCount: 1,
        lastContactedAt: t0,
      }),
    );
    expect(position).toEqual({
      stage: "discovery",
      step: {
        id: "awaitDiscoveryReply",
        followUpOn: new Date(t0.getTime() + 3 * DAY),
      },
    });
  });

  it("stops dating follow-ups once the follow-up was sent", () => {
    const position = funnelPositionFor(
      input({
        pipelineStatus: "awaiting_reply",
        followUpCount: 2,
        lastContactedAt: t0,
      }),
    );
    expect(position.step).toEqual({
      id: "awaitDiscoveryReply",
      followUpOn: null,
    });
  });

  it("asks for the video after a discovery conversation", () => {
    expect(funnelPositionFor(input({ pipelineStatus: "contacted" }))).toEqual({
      stage: "discovery",
      step: { id: "sendVideo" },
    });
  });

  it("moves to outreach once the video was sent", () => {
    expect(
      funnelPositionFor(
        input({
          pipelineStatus: "awaiting_reply",
          followUpCount: 1,
          lastContactedAt: t0,
          hasVideoSent: true,
        }),
      ).stage,
    ).toBe("outreach");
    expect(
      funnelPositionFor(
        input({ pipelineStatus: "contacted", hasVideoSent: true }),
      ),
    ).toEqual({ stage: "outreach", step: { id: "offerDemo" } });
  });

  it("keeps a call-back in the stage it came from", () => {
    const at = new Date(t0.getTime() + DAY);
    expect(
      funnelPositionFor(
        input({ pipelineStatus: "callback_scheduled", nextActionAt: at }),
      ),
    ).toEqual({ stage: "discovery", step: { id: "callBack", at } });
    expect(
      funnelPositionFor(
        input({
          pipelineStatus: "callback_scheduled",
          nextActionAt: at,
          hasVideoSent: true,
        }),
      ).stage,
    ).toBe("outreach");
  });

  it("covers the demo stage", () => {
    expect(funnelPositionFor(input({ pipelineStatus: "demo_agreed" }))).toEqual(
      { stage: "demo", step: { id: "bookDemo" } },
    );
    expect(
      funnelPositionFor(
        input({ pipelineStatus: "demo_scheduled", nextActionAt: t0 }),
      ),
    ).toEqual({ stage: "demo", step: { id: "runDemo", at: t0 } });
  });

  it("derives the trial from the demo date", () => {
    expect(
      funnelPositionFor(
        input({ pipelineStatus: "demo_done", lastDemoDoneAt: t0 }),
      ),
    ).toEqual({
      stage: "trial",
      step: {
        id: "runTrial",
        week1: new Date(t0.getTime() + 7 * DAY),
        week4: new Date(t0.getTime() + 28 * DAY),
        day30: new Date(t0.getTime() + 30 * DAY),
      },
    });
    expect(
      funnelPositionFor(input({ pipelineStatus: "demo_done" })).step,
    ).toEqual({ id: "startTrial" });
  });

  it("asks paying clients for a referral", () => {
    expect(funnelPositionFor(input({ pipelineStatus: "won" }))).toEqual({
      stage: "paying",
      step: { id: "askReferral" },
    });
  });

  it.each(["lost", "parked", "blocked_no_number"] as const)(
    "closes %s leads",
    (pipelineStatus) => {
      expect(funnelPositionFor(input({ pipelineStatus }))).toEqual({
        stage: "closed",
        step: { id: "closed" },
      });
    },
  );
});

describe("video outcome convention", () => {
  it("matches only WhatsApp sends whose outcome starts with VIDEO", () => {
    expect(isVideoSentOutcome("whatsapp_sent", VIDEO_SENT_OUTCOME)).toBe(true);
    expect(isVideoSentOutcome("whatsapp_sent", " video sent")).toBe(true);
    expect(isVideoSentOutcome("whatsapp_sent", "sent the price")).toBe(false);
    expect(isVideoSentOutcome("whatsapp_sent", null)).toBe(false);
    expect(isVideoSentOutcome("note", VIDEO_SENT_OUTCOME)).toBe(false);
  });

  it("reads both facts from a log", () => {
    const later = new Date(t0.getTime() + 5 * DAY);
    expect(
      funnelFactsFromActivities([
        { type: "whatsapp_sent", outcome: VIDEO_SENT_OUTCOME, occurredAt: t0 },
        { type: "demo_done", outcome: null, occurredAt: t0 },
        { type: "demo_done", outcome: null, occurredAt: later },
      ]),
    ).toEqual({ hasVideoSent: true, lastDemoDoneAt: later });
    expect(funnelFactsFromActivities([])).toEqual({
      hasVideoSent: false,
      lastDemoDoneAt: null,
    });
  });
});
