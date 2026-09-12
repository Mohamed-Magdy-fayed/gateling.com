import { and, eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { BookingsTable } from "@/drizzle/schema";
import {
  completeBookingForMeeting,
  decideBookingCompletion,
} from "@/features/system/bookings/server/meeting";
import { resolveMeetingsClient } from "@/features/system/meetings/config";
import { inngest, meetingsWebhookReceivedEvent } from "../client";

/**
 * Close the loop from the room back to the booking: a call whose room ended
 * after the slot started, with both host and guest in it, is done. Anything
 * short of that is left for staff (`updateStatus`) — completing a booking
 * silences its reminders and hides the join buttons, so the rule errs on the
 * side of doing nothing. Demo rooms (`lead:*`) are ignored; their outcome is
 * logged by staff as `demo_done`.
 */
export const onMeetingsWebhook = inngest.createFunction(
  { id: "on-meetings-webhook", triggers: [meetingsWebhookReceivedEvent] },
  async ({ event, step }) => {
    const { meeting } = event.data.data;
    if (event.data.event !== "meeting.ended")
      return { ignored: event.data.event };
    if (!meeting.externalRef?.startsWith("booking:"))
      return { ignored: "not_a_booking" };

    return step.run("complete-booking", async () => {
      // Keyed on the room, not the id in externalRef: a booking rescheduled
      // onto a fresh room must not be completed by its old room ending.
      const booking = await db.query.BookingsTable.findFirst({
        where: and(
          eq(BookingsTable.meetingCode, meeting.code),
          eq(BookingsTable.status, "confirmed"),
        ),
        columns: { id: true, status: true, startsAt: true },
      });
      if (!booking) return { skipped: "no_confirmed_booking_for_room" };

      const client = await resolveMeetingsClient(db);
      if (!client) return { skipped: "meetings_not_configured" };
      const participants = await client.listParticipants(meeting.code);

      const decision = decideBookingCompletion(
        booking,
        participants,
        meeting.endedAt
          ? new Date(meeting.endedAt)
          : new Date(event.data.createdAt),
      );
      if (!decision.complete) return { skipped: decision.reason };

      const completed = await completeBookingForMeeting(
        db,
        booking.id,
        meeting.code,
      );
      return completed ? { completed: true } : { skipped: "state_changed" };
    });
  },
);
