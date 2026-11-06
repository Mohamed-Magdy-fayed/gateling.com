import type { LeadPipelineStatus } from "@/drizzle/schema";

import type { YesAnswer, YesStep } from "./yeses";

/**
 * What ticking a yes or a no does to the lead's pipeline status. Pure, so the
 * lead page (to decide whether to ask for a demo time or offer to close the
 * lead) and the server (which applies it) cannot disagree.
 *
 * Ticks only move a lead forward, never back:
 * - ✓ Demo booked   → `demo_scheduled`, which needs the demo time (the
 *                     Meetings room is provisioned from it)
 * - ✓ Free trial    → `demo_done` (the trial starts after the demo)
 * - ✓ Subscribes    → `won`
 * - ✗ on any step   → offer to mark the lead `lost`; a no is not always the
 *                     end, so the operator decides
 * Steps 1–3 and Referrals are covered by normal logging and change nothing.
 * A yes on a closed lead (lost, parked, no number) reopens it.
 */

export type TickStatusEffect =
  | { kind: "none" }
  | { kind: "bookDemo" }
  | { kind: "advance"; to: "demo_done" | "won" }
  | { kind: "offerLost" };

/** How far along the pipeline a status is. Closed statuses count as the start. */
const STATUS_RANK: Record<LeadPipelineStatus, number> = {
  new: 0,
  lost: 0,
  parked: 0,
  blocked_no_number: 0,
  awaiting_reply: 1,
  contacted: 1,
  callback_scheduled: 1,
  demo_agreed: 2,
  demo_scheduled: 3,
  demo_done: 4,
  won: 5,
};

const CLOSED: ReadonlySet<LeadPipelineStatus> = new Set([
  "lost",
  "parked",
  "blocked_no_number",
]);

export function statusEffectForTick(
  step: YesStep,
  answer: YesAnswer | null,
  status: LeadPipelineStatus,
): TickStatusEffect {
  if (answer === "no") {
    return CLOSED.has(status) || status === "won"
      ? { kind: "none" }
      : { kind: "offerLost" };
  }
  if (answer !== "yes") return { kind: "none" };

  const rank = STATUS_RANK[status];
  if (step === "demo" && rank < STATUS_RANK.demo_scheduled) {
    return { kind: "bookDemo" };
  }
  if (step === "trial" && rank < STATUS_RANK.demo_done) {
    return { kind: "advance", to: "demo_done" };
  }
  if (step === "subscribe" && rank < STATUS_RANK.won) {
    return { kind: "advance", to: "won" };
  }
  return { kind: "none" };
}
