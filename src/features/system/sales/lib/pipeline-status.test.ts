import { describe, expect, it } from "vitest";

import {
  isBlockedOutbound,
  isTerminalPipelineStatus,
  shouldDischargePromises,
} from "./pipeline-status";

describe("isTerminalPipelineStatus", () => {
  it.each(["lost", "won", "parked", "blocked_no_number"] as const)(
    "treats %s as terminal",
    (status) => {
      expect(isTerminalPipelineStatus(status)).toBe(true);
    },
  );

  it.each(["new", "contacted", "callback_scheduled", "demo_agreed"] as const)(
    "treats %s as open",
    (status) => {
      expect(isTerminalPipelineStatus(status)).toBe(false);
    },
  );
});

describe("shouldDischargePromises", () => {
  it("discharges on a contact activity", () => {
    expect(shouldDischargePromises("call", undefined)).toBe(true);
    expect(shouldDischargePromises("no_answer", undefined)).toBe(true);
  });

  // A lost lead must not reappear in Overdue because of an old call-back.
  it("discharges when a non-contact log closes the lead", () => {
    expect(shouldDischargePromises("status_change", "lost")).toBe(true);
    expect(shouldDischargePromises("note", "parked")).toBe(true);
  });

  it("keeps promises on a status change to an open status", () => {
    expect(shouldDischargePromises("status_change", "contacted")).toBe(false);
    expect(shouldDischargePromises("note", undefined)).toBe(false);
  });
});

describe("isBlockedOutbound", () => {
  it.each(["call", "no_answer", "call_unclear", "whatsapp_sent"])(
    "blocks %s to a do-not-contact lead",
    (type) => {
      expect(isBlockedOutbound(type, true)).toBe(true);
    },
  );

  it("allows inbound and bookkeeping entries on a do-not-contact lead", () => {
    expect(isBlockedOutbound("whatsapp_reply", true)).toBe(false);
    expect(isBlockedOutbound("note", true)).toBe(false);
    expect(isBlockedOutbound("status_change", true)).toBe(false);
  });

  it("never blocks a contactable lead", () => {
    expect(isBlockedOutbound("call", false)).toBe(false);
  });
});
