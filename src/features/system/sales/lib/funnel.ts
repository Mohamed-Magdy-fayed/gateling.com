import type { LeadPipelineStatus } from "@/drizzle/schema";

/**
 * Where a lead sits in the atelier sales funnel, and what to do next.
 *
 * The funnel (Discovery → Outreach → Demo → Trial → Paying) is the founder's
 * "Gateling Atelier System – Sales Funnel" doc. It is derived entirely from
 * existing data — `pipelineStatus`, the cached columns and a few facts about
 * the activity log — so there is no stage column to keep in sync.
 *
 * Pure and clock-free: dates in the result are computed from the lead's own
 * history, and the UI translates the structured step, like `today-rules.ts`.
 */

export type FunnelStageId =
  | "discovery"
  | "outreach"
  | "demo"
  | "trial"
  | "paying"
  | "closed";

/** The ordered stages a lead moves through. `closed` sits outside the line. */
export const FUNNEL_STAGES = [
  "discovery",
  "outreach",
  "demo",
  "trial",
  "paying",
] as const satisfies readonly FunnelStageId[];

export type FunnelStep =
  | { id: "startDiscovery" }
  | { id: "awaitDiscoveryReply"; followUpOn: Date | null }
  | { id: "sendVideo" }
  | { id: "awaitVideoReply"; followUpOn: Date | null }
  | { id: "offerDemo" }
  | { id: "callBack"; at: Date | null }
  | { id: "bookDemo" }
  | { id: "runDemo"; at: Date | null }
  | { id: "runTrial"; week1: Date; week4: Date; day30: Date }
  | { id: "startTrial" }
  | { id: "askReferral" }
  | { id: "closed" };

export type FunnelPosition = { stage: FunnelStageId; step: FunnelStep };

export type FunnelInput = {
  pipelineStatus: LeadPipelineStatus;
  followUpCount: number;
  lastContactedAt: Date | null;
  /** Earliest unfulfilled promise (call-back or demo time). */
  nextActionAt: Date | null;
  /** The video + case-study link has been sent (see `isVideoSentOutcome`). */
  hasVideoSent: boolean;
  /** Latest `demo_done`; the trial is counted from it. */
  lastDemoDoneAt: Date | null;
};

/** Days after the last unanswered message before the one follow-up is due. */
export const FOLLOW_UP_AFTER_DAYS = 3;
/** Unanswered attempts at which we stop messaging (WhatsApp ban safety limit). */
export const MAX_UNANSWERED = 2;

const MS_PER_DAY = 86_400_000;

/**
 * Outcome text that marks a `whatsapp_sent` as "sent the video + case study".
 * A text convention, like the `DEPOSIT` note, so no schema change is needed.
 */
export const VIDEO_SENT_OUTCOME = "VIDEO: sent video + case study";

export function isVideoSentOutcome(
  type: string,
  outcome: string | null,
): boolean {
  return (
    type === "whatsapp_sent" &&
    outcome !== null &&
    outcome.trim().toUpperCase().startsWith("VIDEO")
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** When the single follow-up falls due; null once it has already been sent. */
function followUpOn(input: FunnelInput): Date | null {
  if (input.followUpCount >= MAX_UNANSWERED || !input.lastContactedAt) {
    return null;
  }
  return addDays(input.lastContactedAt, FOLLOW_UP_AFTER_DAYS);
}

export function funnelPositionFor(input: FunnelInput): FunnelPosition {
  const early: FunnelStageId = input.hasVideoSent ? "outreach" : "discovery";

  switch (input.pipelineStatus) {
    case "new":
      return { stage: "discovery", step: { id: "startDiscovery" } };
    case "awaiting_reply":
      return input.hasVideoSent
        ? {
            stage: "outreach",
            step: { id: "awaitVideoReply", followUpOn: followUpOn(input) },
          }
        : {
            stage: "discovery",
            step: { id: "awaitDiscoveryReply", followUpOn: followUpOn(input) },
          };
    case "contacted":
      return input.hasVideoSent
        ? { stage: "outreach", step: { id: "offerDemo" } }
        : { stage: "discovery", step: { id: "sendVideo" } };
    case "callback_scheduled":
      return { stage: early, step: { id: "callBack", at: input.nextActionAt } };
    case "demo_agreed":
      return { stage: "demo", step: { id: "bookDemo" } };
    case "demo_scheduled":
      return { stage: "demo", step: { id: "runDemo", at: input.nextActionAt } };
    case "demo_done":
      return input.lastDemoDoneAt
        ? {
            stage: "trial",
            step: {
              id: "runTrial",
              week1: addDays(input.lastDemoDoneAt, 7),
              week4: addDays(input.lastDemoDoneAt, 28),
              day30: addDays(input.lastDemoDoneAt, 30),
            },
          }
        : { stage: "trial", step: { id: "startTrial" } };
    case "won":
      return { stage: "paying", step: { id: "askReferral" } };
    case "lost":
    case "parked":
    case "blocked_no_number":
      return { stage: "closed", step: { id: "closed" } };
  }
}

export type FunnelActivityFacts = {
  type: string;
  outcome: string | null;
  occurredAt: Date;
};

/** The two activity facts the funnel needs, from a lead's full log. */
export function funnelFactsFromActivities(
  activities: readonly FunnelActivityFacts[],
): Pick<FunnelInput, "hasVideoSent" | "lastDemoDoneAt"> {
  let hasVideoSent = false;
  let lastDemoDoneAt: Date | null = null;
  for (const activity of activities) {
    if (isVideoSentOutcome(activity.type, activity.outcome)) {
      hasVideoSent = true;
    }
    if (
      activity.type === "demo_done" &&
      (!lastDemoDoneAt || activity.occurredAt > lastDemoDoneAt)
    ) {
      lastDemoDoneAt = activity.occurredAt;
    }
  }
  return { hasVideoSent, lastDemoDoneAt };
}
