import type { LeadPipelineStatus } from "@/drizzle/schema";

import { isContactActivity } from "./derived";

/**
 * Statuses that close a lead. A closed lead holds no open promises and never
 * appears in a Today bucket — both rules read this one list, so they cannot
 * drift apart.
 */
export const TERMINAL_PIPELINE_STATUSES = [
  "lost",
  "won",
  "parked",
  "blocked_no_number",
] as const satisfies readonly LeadPipelineStatus[];

const TERMINAL_SET = new Set<string>(TERMINAL_PIPELINE_STATUSES);

export function isTerminalPipelineStatus(status: LeadPipelineStatus): boolean {
  return TERMINAL_SET.has(status);
}

/**
 * Whether a log keeps the lead's outstanding promises: contacting the lead
 * honours them, and closing it makes them moot.
 */
export function shouldDischargePromises(
  type: string,
  pipelineStatus: LeadPipelineStatus | undefined,
): boolean {
  return (
    isContactActivity(type) ||
    (pipelineStatus !== undefined && isTerminalPipelineStatus(pipelineStatus))
  );
}

/** Activity types that reach out to the lead. */
const OUTBOUND_ACTIVITY_TYPES = new Set<string>([
  "call",
  "no_answer",
  "call_unclear",
  "whatsapp_sent",
]);

/** A do-not-contact lead may still log replies and notes, never outreach. */
export function isBlockedOutbound(type: string, doNotContact: boolean): boolean {
  return doNotContact && OUTBOUND_ACTIVITY_TYPES.has(type);
}
