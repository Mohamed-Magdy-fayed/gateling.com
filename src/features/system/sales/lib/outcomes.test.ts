import { describe, expect, it } from "vitest";

import type { WhatsappStatus } from "@/drizzle/schema";

import { logActivityInputSchema } from "../server/schemas";
import {
  ALL_OUTCOMES,
  contactActions,
  outcomeById,
  outcomesFor,
  outcomeToLogInput,
  primaryActionFor,
  startingChannel,
} from "./outcomes";
import type { TodayBucketId } from "./today-rules";

const LEAD_ID = "3f1c2b7e-9a4d-4c1e-8b2a-1d2e3f4a5b6c";
const NOW = new Date("2026-10-23T10:00:00.000Z");
const LATER = new Date("2026-10-23T15:00:00.000Z");

type Lead = { phone: string | null; whatsappStatus: WhatsappStatus };
const confirmed: Lead = { phone: "01001234567", whatsappStatus: "confirmed" };
const unconfirmed: Lead = { phone: "01001234567", whatsappStatus: "unknown" };
const noPhone: Lead = { phone: null, whatsappStatus: "unknown" };

describe("primaryActionFor — bucket × WhatsApp status × phone", () => {
  it.each<[TodayBucketId, Lead, string]>([
    ["rescue", confirmed, "call"],
    ["overdue", confirmed, "call"],
    ["followUp", confirmed, "whatsapp"],
    ["followUp", unconfirmed, "call"],
    ["newQueue", confirmed, "call"],
    ["autoPark", confirmed, "park"],
    ["rescue", noPhone, "openLead"],
    ["followUp", noPhone, "openLead"],
  ])("%s with %o → %s", (bucket, lead, expected) => {
    expect(primaryActionFor(bucket, lead)).toBe(expected);
  });

  it("still offers Park in Auto-park when there is no phone", () => {
    expect(primaryActionFor("autoPark", noPhone)).toBe("park");
  });
});

describe("outcomesFor", () => {
  it("shows the call set, terminal outcomes last", () => {
    expect(outcomesFor("rescue", "call").map((o) => o.id)).toEqual([
      "interested",
      "bookDemo",
      "callBack",
      "noAnswer",
      "notInterested",
      "wrongNumber",
    ]);
  });

  it("shows the WhatsApp set on the WhatsApp channel", () => {
    expect(outcomesFor("followUp", "whatsapp").map((o) => o.id)).toEqual([
      "whatsappSent",
      "whatsappReplied",
    ]);
  });

  // The follow-up limit exists to avoid a WhatsApp ban: Auto-park never
  // offers another outbound attempt, whichever channel is selected.
  it("never offers an outbound attempt in Auto-park", () => {
    for (const channel of ["call", "whatsapp"] as const) {
      const outcomes = outcomesFor("autoPark", channel);
      expect(outcomes.map((o) => o.id)).toEqual(["park", "theyReplied", "answeredCall"]);
      for (const outcome of outcomes) {
        expect(["whatsapp_sent", "no_answer", "call_unclear"]).not.toContain(
          outcome.type,
        );
      }
    }
  });
});

describe("startingChannel", () => {
  it("follows the primary action", () => {
    expect(startingChannel("followUp", confirmed)).toBe("whatsapp");
    expect(startingChannel("followUp", unconfirmed)).toBe("call");
    expect(startingChannel("overdue", confirmed)).toBe("call");
  });
});

describe("outcomeToLogInput", () => {
  const needsTime = new Set(["bookDemo", "callBack"]);

  it.each(ALL_OUTCOMES.filter((o) => o.kind === "log").map((o) => [o.id, o] as const))(
    "%s produces a payload the logActivity schema accepts",
    (id, outcome) => {
      const result = outcomeToLogInput(
        outcome,
        LEAD_ID,
        needsTime.has(id) ? LATER : null,
        NOW,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(logActivityInputSchema.safeParse(result.input).success).toBe(true);
    },
  );

  it("maps the call outcomes to type, channel and status", () => {
    const pick = (id: Parameters<typeof outcomeById>[0], at: Date | null = null) => {
      const result = outcomeToLogInput(outcomeById(id), LEAD_ID, at, NOW);
      if (!result.ok) throw new Error(result.error);
      const { type, channel, pipelineStatus } = result.input;
      return { type, channel, pipelineStatus };
    };
    expect(pick("interested")).toEqual({ type: "demo_agreed", channel: "phone", pipelineStatus: "demo_agreed" });
    expect(pick("bookDemo", LATER)).toEqual({ type: "demo_scheduled", channel: "phone", pipelineStatus: "demo_scheduled" });
    expect(pick("callBack", LATER)).toEqual({ type: "call", channel: "phone", pipelineStatus: "callback_scheduled" });
    expect(pick("noAnswer")).toEqual({ type: "no_answer", channel: "phone", pipelineStatus: "awaiting_reply" });
    expect(pick("notInterested")).toEqual({ type: "call", channel: "phone", pipelineStatus: "lost" });
    expect(pick("wrongNumber")).toEqual({ type: "call_unclear", channel: "phone", pipelineStatus: "blocked_no_number" });
    expect(pick("whatsappSent")).toEqual({ type: "whatsapp_sent", channel: "whatsapp", pipelineStatus: "awaiting_reply" });
    expect(pick("whatsappReplied")).toEqual({ type: "whatsapp_reply", channel: "whatsapp", pipelineStatus: "contacted" });
    expect(pick("theyReplied")).toEqual({ type: "whatsapp_reply", channel: "whatsapp", pipelineStatus: "contacted" });
    expect(pick("answeredCall")).toEqual({ type: "call", channel: "phone", pipelineStatus: "contacted" });
  });

  it("puts the needed time on nextActionAt", () => {
    const result = outcomeToLogInput(outcomeById("callBack"), LEAD_ID, LATER, NOW);
    expect(result.ok && result.input.nextActionAt).toEqual(LATER);
  });

  it("rejects a missing or past time for outcomes that need one", () => {
    expect(outcomeToLogInput(outcomeById("bookDemo"), LEAD_ID, null, NOW)).toEqual({
      ok: false,
      error: "timeRequired",
    });
    expect(outcomeToLogInput(outcomeById("callBack"), LEAD_ID, NOW, NOW)).toEqual({
      ok: false,
      error: "timeInPast",
    });
  });

  it("marks Not interested, Wrong number and Park as terminal (undoable)", () => {
    expect(ALL_OUTCOMES.filter((o) => o.terminal).map((o) => o.id).sort()).toEqual(
      ["notInterested", "park", "wrongNumber"],
    );
  });
});

describe("contactActions — what the Up next card may offer", () => {
  it("hides Call and WhatsApp in Auto-park", () => {
    const actions = contactActions("autoPark", confirmed);
    expect(actions.call.visible).toBe(false);
    expect(actions.whatsapp.visible).toBe(false);
  });

  it("disables both with a reason when there is no phone", () => {
    const actions = contactActions("overdue", noPhone);
    expect(actions.call).toEqual({ visible: true, enabled: false, reason: "noPhone" });
    expect(actions.whatsapp).toMatchObject({ visible: true, enabled: false, reason: "noPhone" });
  });

  it("enables WhatsApp for any linkable number, flagging an unconfirmed one", () => {
    expect(contactActions("followUp", unconfirmed).whatsapp).toEqual({
      visible: true,
      enabled: true,
      unconfirmed: true,
    });
    expect(contactActions("followUp", confirmed).whatsapp).toEqual({
      visible: true,
      enabled: true,
      unconfirmed: false,
    });
  });
});
