import type { LeadActivityType } from "@/drizzle/schema";

/**
 * Derivation of the cached lead columns from the activity log.
 *
 * Pure and DB-free on purpose: these three values decide which bucket a lead
 * lands in, so they need to be testable without a database, and there must be
 * exactly one implementation. `recomputeLeadDerived` in the service layer is
 * a thin wrapper — query, call this, write back.
 */

/** Activity types that count as "we made contact". */
export const CONTACT_ACTIVITY_TYPES = [
  "call",
  "no_answer",
  "call_unclear",
  "whatsapp_sent",
  "whatsapp_reply",
  "demo_agreed",
  "demo_scheduled",
  "demo_done",
] as const satisfies readonly LeadActivityType[];

/** Outbound attempts that count toward the follow-up safety limit. */
export const FOLLOW_UP_ACTIVITY_TYPES = [
  "whatsapp_sent",
  "call",
] as const satisfies readonly LeadActivityType[];

const CONTACT_SET = new Set<string>(CONTACT_ACTIVITY_TYPES);
const FOLLOW_UP_SET = new Set<string>(FOLLOW_UP_ACTIVITY_TYPES);

export function isContactActivity(type: string): boolean {
  return CONTACT_SET.has(type);
}

export type DerivedActivityInput = {
  type: LeadActivityType | string;
  occurredAt: Date;
  nextActionAt: Date | null;
  nextActionDoneAt: Date | null;
};

export type DerivedLeadValues = {
  lastContactedAt: Date | null;
  followUpCount: number;
  nextActionAt: Date | null;
};

export function computeDerived(
  activities: readonly DerivedActivityInput[],
): DerivedLeadValues {
  let lastContactedAt: Date | null = null;
  let nextActionAt: Date | null = null;
  // Counts outbound attempts *since the last inbound reply* — a reply resets
  // the count, because the conversation restarted.
  let followUpCount = 0;

  // Chronological, so the reply reset applies to the attempts that follow it.
  const ordered = [...activities].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );

  for (const activity of ordered) {
    if (CONTACT_SET.has(activity.type)) {
      if (!lastContactedAt || activity.occurredAt > lastContactedAt) {
        lastContactedAt = activity.occurredAt;
      }
    }

    if (activity.type === "whatsapp_reply") {
      followUpCount = 0;
    } else if (FOLLOW_UP_SET.has(activity.type)) {
      followUpCount += 1;
    }

    if (activity.nextActionAt && activity.nextActionDoneAt === null) {
      if (!nextActionAt || activity.nextActionAt < nextActionAt) {
        nextActionAt = activity.nextActionAt;
      }
    }
  }

  return { lastContactedAt, followUpCount, nextActionAt };
}
