import type {
  LeadActivityChannel,
  LeadActivityType,
  LeadPipelineStatus,
  WhatsappStatus,
} from "@/drizzle/schema";
import { toWhatsAppUrl } from "@/lib/phone";

import type { TodayBucketId } from "./today-rules";

/**
 * What one tap on the Today page logs. Pure and DB-free: the Up next card,
 * the `?` shortcut panel, the docs and the tests all read these tables, so the
 * mapping from "how did it go?" to an activity cannot drift between them.
 *
 * Every `log` outcome becomes a normal `sales.logActivity` call — the same
 * rows the sell-first day-14 query counts, and `demo_scheduled` still triggers
 * the Meetings room provisioning in the router.
 */

export type Channel = "call" | "whatsapp";

export type OutcomeId =
  | "interested"
  | "bookDemo"
  | "callBack"
  | "noAnswer"
  | "notInterested"
  | "wrongNumber"
  | "whatsappSent"
  | "whatsappReplied"
  | "park"
  | "theyReplied"
  | "answeredCall";

export type Outcome = {
  id: OutcomeId;
  /** `log` → `sales.logActivity`; `park` → `sales.park`. */
  kind: "log" | "park";
  type: LeadActivityType | null;
  channel: LeadActivityChannel | null;
  pipelineStatus: LeadPipelineStatus;
  /** Needs a future `nextActionAt` (demo time or call-back time). */
  needsTime: boolean;
  /** Closes the lead; offered with Undo and styled as destructive. */
  terminal: boolean;
};

function log(
  id: OutcomeId,
  type: LeadActivityType,
  channel: LeadActivityChannel,
  pipelineStatus: LeadPipelineStatus,
  extra: Partial<Pick<Outcome, "needsTime" | "terminal">> = {},
): Outcome {
  return {
    id,
    kind: "log",
    type,
    channel,
    pipelineStatus,
    needsTime: extra.needsTime ?? false,
    terminal: extra.terminal ?? false,
  };
}

/** Terminal outcomes are listed last so they sit at the end of the row. */
const CALL_OUTCOMES: readonly Outcome[] = [
  log("interested", "demo_agreed", "phone", "demo_agreed"),
  log("bookDemo", "demo_scheduled", "phone", "demo_scheduled", { needsTime: true }),
  log("callBack", "call", "phone", "callback_scheduled", { needsTime: true }),
  log("noAnswer", "no_answer", "phone", "awaiting_reply"),
  log("notInterested", "call", "phone", "lost", { terminal: true }),
  log("wrongNumber", "call_unclear", "phone", "blocked_no_number", { terminal: true }),
];

const WHATSAPP_OUTCOMES: readonly Outcome[] = [
  log("whatsappSent", "whatsapp_sent", "whatsapp", "awaiting_reply"),
  log("whatsappReplied", "whatsapp_reply", "whatsapp", "contacted"),
];

/**
 * Chased twice and silent. No outbound outcome here on purpose: a third
 * message risks a WhatsApp ban on the business number.
 */
const AUTO_PARK_OUTCOMES: readonly Outcome[] = [
  {
    id: "park",
    kind: "park",
    type: null,
    channel: null,
    pipelineStatus: "parked",
    needsTime: false,
    terminal: true,
  },
  log("theyReplied", "whatsapp_reply", "whatsapp", "contacted"),
  log("answeredCall", "call", "phone", "contacted"),
];

export const ALL_OUTCOMES: readonly Outcome[] = [
  ...CALL_OUTCOMES,
  ...WHATSAPP_OUTCOMES,
  ...AUTO_PARK_OUTCOMES,
];

export function outcomeById(id: OutcomeId): Outcome {
  const found = ALL_OUTCOMES.find((o) => o.id === id);
  if (!found) throw new Error(`Unknown outcome: ${id}`);
  return found;
}

/** The outcome set shown under Up next, in display (and digit-key) order. */
export function outcomesFor(
  bucket: TodayBucketId,
  channel: Channel,
): readonly Outcome[] {
  if (bucket === "autoPark") return AUTO_PARK_OUTCOMES;
  return channel === "whatsapp" ? WHATSAPP_OUTCOMES : CALL_OUTCOMES;
}

type ContactLead = {
  phone: string | null;
  whatsappStatus: WhatsappStatus;
};

function hasPhone(lead: ContactLead): boolean {
  return Boolean(lead.phone && lead.phone.trim().length > 0);
}

export type PrimaryAction = "call" | "whatsapp" | "park" | "openLead";

/** The one `variant="default"` button on the Up next card. */
export function primaryActionFor(
  bucket: TodayBucketId,
  lead: ContactLead,
): PrimaryAction {
  if (bucket === "autoPark") return "park";
  if (!hasPhone(lead)) return "openLead";
  if (bucket === "followUp" && lead.whatsappStatus === "confirmed") {
    return "whatsapp";
  }
  return "call";
}

/** The channel whose outcome set Up next shows before any button is pressed. */
export function startingChannel(
  bucket: TodayBucketId,
  lead: ContactLead,
): Channel {
  return primaryActionFor(bucket, lead) === "whatsapp" ? "whatsapp" : "call";
}

export type ContactAction =
  | { visible: false }
  | { visible: true; enabled: true; unconfirmed?: boolean }
  | { visible: true; enabled: false; reason: "noPhone"; unconfirmed?: boolean };

/** Which contact buttons Up next shows, and why one is disabled. */
export function contactActions(
  bucket: TodayBucketId,
  lead: ContactLead,
): { call: ContactAction; whatsapp: ContactAction } {
  if (bucket === "autoPark") {
    return { call: { visible: false }, whatsapp: { visible: false } };
  }
  const call: ContactAction = hasPhone(lead)
    ? { visible: true, enabled: true }
    : { visible: true, enabled: false, reason: "noPhone" };
  const unconfirmed = lead.whatsappStatus !== "confirmed";
  const whatsapp: ContactAction = toWhatsAppUrl(lead.phone)
    ? { visible: true, enabled: true, unconfirmed }
    : { visible: true, enabled: false, reason: "noPhone", unconfirmed };
  return { call, whatsapp };
}

export type LogInput = {
  leadId: string;
  type: LeadActivityType;
  channel: LeadActivityChannel;
  pipelineStatus: LeadPipelineStatus;
  nextActionAt?: Date;
};

/**
 * The `sales.logActivity` payload for a `log` outcome. A time is required
 * where the outcome needs one and must be in the future — a call-back in the
 * past would land straight in Overdue.
 */
export function outcomeToLogInput(
  outcome: Outcome,
  leadId: string,
  at: Date | null,
  now: Date,
):
  | { ok: true; input: LogInput }
  | { ok: false; error: "timeRequired" | "timeInPast" | "notALog" } {
  if (outcome.kind !== "log" || !outcome.type || !outcome.channel) {
    return { ok: false, error: "notALog" };
  }
  if (outcome.needsTime) {
    if (!at) return { ok: false, error: "timeRequired" };
    if (at.getTime() <= now.getTime()) return { ok: false, error: "timeInPast" };
  }
  return {
    ok: true,
    input: {
      leadId,
      type: outcome.type,
      channel: outcome.channel,
      pipelineStatus: outcome.pipelineStatus,
      ...(outcome.needsTime && at ? { nextActionAt: at } : {}),
    },
  };
}
