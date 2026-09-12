import "server-only";

import { eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { type Booking, BookingsTable } from "@/drizzle/schema";
import {
  cancelScheduledMeeting,
  type ExternalUser,
  ensureScheduledMeeting,
  type MeetingsClient,
  mintHostJoinLink,
} from "@/integrations/meetings";

import type { BookingSettings } from "../lib/settings";

/**
 * The website books the slot; Gateling Meetings provides the room. Every
 * meeting this site creates is hosted by one fixed linked identity, so any
 * staff member can mint a host link for it — Meetings only honours a host
 * link whose `externalId` matches the meeting's host.
 */
export const WEBSITE_MEETING_HOST_EXTERNAL_ID = "gateling-website";

export function websiteMeetingHost(contactEmail: string): ExternalUser {
  return {
    externalId: WEBSITE_MEETING_HOST_EXTERNAL_ID,
    name: "Gateling Solutions",
    email: contactEmail,
  };
}

type Db = typeof database;

type BookingMeetingFields = Pick<
  Booking,
  "id" | "name" | "startsAt" | "meetingCode" | "meetingGuestUrl"
>;

/** The link to put in customer emails: the room if we have one, else the static fallback. */
export function bookingMeetingLink(
  booking: Pick<Booking, "meetingGuestUrl">,
  settings: Pick<BookingSettings, "meetingLink">,
): string | null {
  return booking.meetingGuestUrl ?? settings.meetingLink;
}

export function bookingExternalRef(bookingId: string): string {
  return `booking:${bookingId}`;
}

/**
 * Create the room for a confirmed booking, or move it when the booking was
 * rescheduled, and persist the code + guest link. Safe to retry: the same
 * booking at the same time carries the same idempotency key.
 */
export async function provisionBookingMeeting(
  db: Db,
  client: MeetingsClient,
  booking: BookingMeetingFields,
  settings: Pick<BookingSettings, "slotMinutes" | "timezone">,
  host: ExternalUser,
): Promise<{
  code: string;
  guestUrl: string;
  action: "created" | "rescheduled";
}> {
  const { meeting, action } = await ensureScheduledMeeting(client, {
    externalRef: bookingExternalRef(booking.id),
    existingCode: booking.meetingCode,
    title: `Call with ${booking.name}`,
    host,
    scheduledAt: booking.startsAt,
    durationMinutes: settings.slotMinutes,
    timezone: settings.timezone,
    settings: { waitingRoom: true, allowGuests: true },
  });

  if (
    meeting.code !== booking.meetingCode ||
    meeting.guestUrl !== booking.meetingGuestUrl
  ) {
    await db
      .update(BookingsTable)
      .set({ meetingCode: meeting.code, meetingGuestUrl: meeting.guestUrl })
      .where(eq(BookingsTable.id, booking.id));
  }

  return { code: meeting.code, guestUrl: meeting.guestUrl, action };
}

/** Drop the room of a cancelled booking. A room that is already gone is not an error. */
export async function cancelBookingMeeting(
  client: MeetingsClient,
  booking: Pick<Booking, "meetingCode">,
): Promise<boolean> {
  if (!booking.meetingCode) return false;
  return cancelScheduledMeeting(client, booking.meetingCode);
}

export function bookingHostJoinLink(
  client: MeetingsClient,
  meetingCode: string,
  host: ExternalUser,
  returnUrl: string,
) {
  return mintHostJoinLink(client, meetingCode, host, { returnUrl });
}
