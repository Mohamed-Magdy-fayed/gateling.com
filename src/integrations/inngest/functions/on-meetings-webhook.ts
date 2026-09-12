import { eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { BookingsTable } from "@/drizzle/schema";
import { getMeetingsClient } from "@/integrations/meetings";
import { inngest, meetingsWebhookReceivedEvent } from "../client";

const BOOKING_REF = /^booking:([0-9a-f-]{36})$/;

/**
 * Close the loop from the room back to the booking: when a call's room ends
 * and a guest actually joined, the booking is done. No guest means the
 * customer never showed — left for staff to mark as no-show deliberately.
 * Demo rooms (`lead:*`) are ignored; their outcome is logged by staff.
 */
export const onMeetingsWebhook = inngest.createFunction(
  { id: "on-meetings-webhook", triggers: [meetingsWebhookReceivedEvent] },
  async ({ event, step }) => {
    if (event.data.event !== "meeting.ended")
      return { ignored: event.data.event };

    const bookingId = BOOKING_REF.exec(
      event.data.data.meeting.externalRef ?? "",
    )?.[1];
    if (!bookingId) return { ignored: "not_a_booking" };

    return step.run("complete-booking", async () => {
      const booking = await db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, bookingId),
        columns: { id: true, status: true, meetingCode: true },
      });
      if (!booking || booking.status !== "confirmed")
        return { skipped: "not_confirmed" };
      if (booking.meetingCode !== event.data.data.meeting.code)
        return { skipped: "stale_room" };

      const client = getMeetingsClient();
      if (!client) return { skipped: "meetings_not_configured" };
      const participants = await client.listParticipants(booking.meetingCode);
      const guestJoined = participants.some((p) => p.role === "participant");
      if (!guestJoined) return { skipped: "no_guest" };

      await db
        .update(BookingsTable)
        .set({ status: "completed" })
        .where(eq(BookingsTable.id, booking.id));
      return { completed: true };
    });
  },
);
