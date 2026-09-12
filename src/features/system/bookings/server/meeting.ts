import "server-only";

import { and, eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { type Booking, BookingsTable } from "@/drizzle/schema";
import {
  cancelScheduledMeeting,
  type ExternalUser,
  ensureScheduledMeeting,
  type MeetingsClient,
  mintHostJoinLink,
  type Participant,
} from "@/integrations/meetings";

import type { BookingSettings } from "../lib/settings";

/**
 * The website books the slot; Gateling Meetings provides the room. Rooms are
 * keyed by `externalRef booking:<id>` and hosted by the site-wide identity in
 * `@/features/system/meetings/host`.
 */

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
 * booking at the same time carries the same idempotency key. The write is a
 * compare-and-set on the booking's time and status, so a run that lost a race
 * with a reschedule or cancellation cannot overwrite the newer room.
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
      .where(
        and(
          eq(BookingsTable.id, booking.id),
          eq(BookingsTable.status, "confirmed"),
          eq(BookingsTable.startsAt, booking.startsAt),
        ),
      );
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

export type BookingCompletionDecision =
  | { complete: true }
  | {
      complete: false;
      reason: "not_confirmed" | "ended_before_start" | "no_host" | "no_guest";
    };

/**
 * Whether a `meeting.ended` delivery means the call actually happened. Pure,
 * so the rule is testable without Inngest: the booking must still be
 * confirmed, the room must have ended after the slot started (a staff member
 * testing the link the day before is not the call), and both a host and a
 * guest must have been in it. Anything else is left for staff to judge —
 * completing a booking silences its reminders and hides the join buttons.
 */
export function decideBookingCompletion(
  booking: Pick<Booking, "status" | "startsAt">,
  participants: ReadonlyArray<Pick<Participant, "role">>,
  endedAt: Date,
): BookingCompletionDecision {
  if (booking.status !== "confirmed")
    return { complete: false, reason: "not_confirmed" };
  if (endedAt < booking.startsAt)
    return { complete: false, reason: "ended_before_start" };
  if (!participants.some((p) => p.role === "host"))
    return { complete: false, reason: "no_host" };
  if (!participants.some((p) => p.role === "participant"))
    return { complete: false, reason: "no_guest" };
  return { complete: true };
}

/**
 * Compare-and-set completion for the booking that owns `meetingCode`. Returns
 * `false` when the row changed under us (cancelled, rescheduled to a new
 * room, already completed) — the webhook must never clobber a newer state.
 */
export async function completeBookingForMeeting(
  db: Db,
  bookingId: string,
  meetingCode: string,
): Promise<boolean> {
  const rows = await db
    .update(BookingsTable)
    .set({ status: "completed" })
    .where(
      and(
        eq(BookingsTable.id, bookingId),
        eq(BookingsTable.status, "confirmed"),
        eq(BookingsTable.meetingCode, meetingCode),
      ),
    )
    .returning({ id: BookingsTable.id });
  return rows.length === 1;
}
