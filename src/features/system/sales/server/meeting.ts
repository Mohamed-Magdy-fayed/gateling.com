import "server-only";

import { and, eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { type Lead, LeadsTable } from "@/drizzle/schema";
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
      .where(and(eq(LeadsTable.id, lead.id), eq(LeadsTable.kind, "prospect")));
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
