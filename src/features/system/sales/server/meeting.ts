import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { type Lead, LeadActivitiesTable, LeadsTable } from "@/drizzle/schema";
import {
  type ExternalUser,
  ensureScheduledMeeting,
  type MeetingsClient,
  mintHostJoinLink,
} from "@/integrations/meetings";

/**
 * Demo rooms for prospects. One room per lead (`lead:<id>:demo`): logging a
 * second `demo_scheduled` moves the same room rather than opening another.
 * The pipeline sends no messages by design, so the guest link is shown on
 * the lead page for staff to paste into WhatsApp.
 */

type Db = typeof database;

export const DEMO_DURATION_MINUTES = 45;

export function leadDemoExternalRef(leadId: string): string {
  return `lead:${leadId}:demo`;
}

/** `undefined` when there is no such prospect; `null` when it has no room yet. */
export async function getLeadDemoMeetingCode(
  db: Pick<Db, "query">,
  leadId: string,
): Promise<string | null | undefined> {
  const lead = await db.query.LeadsTable.findFirst({
    where: and(eq(LeadsTable.id, leadId), eq(LeadsTable.kind, "prospect")),
    columns: { demoMeetingCode: true },
  });
  return lead?.demoMeetingCode;
}

/**
 * The activity a `lead/demo-scheduled` run must still be the latest of, or
 * stand down. Pure so the rule is testable: a retried run for Tuesday must
 * not move a room that a later log already put on Wednesday.
 */
export function isCurrentDemoActivity(
  eventActivityId: string,
  latestDemoActivityId: string | null | undefined,
): boolean {
  return latestDemoActivityId === eventActivityId;
}

export async function getLatestDemoActivityId(
  db: Pick<Db, "query">,
  leadId: string,
): Promise<string | null> {
  const latest = await db.query.LeadActivitiesTable.findFirst({
    where: and(
      eq(LeadActivitiesTable.leadId, leadId),
      eq(LeadActivitiesTable.type, "demo_scheduled"),
    ),
    orderBy: [
      desc(LeadActivitiesTable.createdAt),
      desc(LeadActivitiesTable.occurredAt),
    ],
    columns: { id: true },
  });
  return latest?.id ?? null;
}

export async function provisionLeadDemoMeeting(
  db: Db,
  client: MeetingsClient,
  lead: Pick<Lead, "id" | "name" | "demoMeetingCode" | "demoMeetingUrl">,
  scheduledAt: Date,
  timezone: string,
  host: ExternalUser,
): Promise<{
  code: string;
  guestUrl: string;
  action: "created" | "rescheduled";
}> {
  const { meeting, action } = await ensureScheduledMeeting(client, {
    externalRef: leadDemoExternalRef(lead.id),
    existingCode: lead.demoMeetingCode,
    title: `Demo — ${lead.name}`,
    host,
    scheduledAt,
    durationMinutes: DEMO_DURATION_MINUTES,
    timezone,
    settings: { waitingRoom: true, allowGuests: true },
  });

  if (
    meeting.code !== lead.demoMeetingCode ||
    meeting.guestUrl !== lead.demoMeetingUrl
  ) {
    await db
      .update(LeadsTable)
      .set({ demoMeetingCode: meeting.code, demoMeetingUrl: meeting.guestUrl })
      .where(
        and(
          eq(LeadsTable.id, lead.id),
          eq(LeadsTable.kind, "prospect"),
          // Compare-and-set: a concurrent run that already stored a newer
          // room wins; this one's write lands on zero rows.
          lead.demoMeetingCode
            ? eq(LeadsTable.demoMeetingCode, lead.demoMeetingCode)
            : undefined,
        ),
      );
  }

  return { code: meeting.code, guestUrl: meeting.guestUrl, action };
}

export function leadDemoHostJoinLink(
  client: MeetingsClient,
  meetingCode: string,
  host: ExternalUser,
  returnUrl: string,
) {
  return mintHostJoinLink(client, meetingCode, host, { returnUrl });
}
