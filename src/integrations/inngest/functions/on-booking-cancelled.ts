import { StepError } from "inngest";

import { db } from "@/drizzle";
import {
  escapeHtml,
  formatBookingTime,
} from "@/features/system/bookings/lib/format";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import { cancelBookingMeeting } from "@/features/system/bookings/server/meeting";
import { sendMail } from "@/integrations/email";
import { getMeetingsClient } from "@/integrations/meetings";
import { bookingCancelledEvent, inngest } from "../client";
import { getBooking, getContactEmail } from "./booking-helpers";

export const onBookingCancelled = inngest.createFunction(
  { id: "on-booking-cancelled", triggers: [bookingCancelledEvent] },
  async ({ event, step, logger }) => {
    const booking = await getBooking(event.data.bookingId);
    if (!booking || booking.status !== "cancelled") return { skipped: true };

    // Free the room before anyone is told; a retried delete is a no-op. If
    // Meetings stays down through the retries, the people still get told —
    // an orphaned room is a smaller failure than a silent cancellation.
    try {
      await step.run("cancel-meeting", async () => {
        const client = getMeetingsClient();
        if (!client) return { skipped: "meetings_not_configured" };
        return { deleted: await cancelBookingMeeting(client, booking) };
      });
    } catch (error) {
      if (!(error instanceof StepError)) throw error;
      logger.error("booking meeting cancellation failed", {
        bookingId: booking.id,
        meetingCode: booking.meetingCode,
        error: error.message,
      });
    }

    const settings = await getBookingSettings(db);
    const customerTz = booking.timezone || settings.timezone;
    const name = escapeHtml(booking.name);

    if (event.data.cancelledBy === "customer") {
      await sendMail({
        to: await getContactEmail(),
        subject: `Call cancelled by customer: ${name}`,
        html: `
          <h2>Booking cancelled</h2>
          <p><strong>Name:</strong> ${name} (${escapeHtml(booking.email)})</p>
          <p><strong>Was scheduled for:</strong>
          ${formatBookingTime(booking.startsAt, settings.timezone)}</p>
        `,
      });
    } else {
      await sendMail({
        to: booking.email,
        subject: "Your call was cancelled — Gateling Solutions",
        html: `
          <h2>Booking cancelled</h2>
          <p>Hi ${name}, your call scheduled for
          <strong>${formatBookingTime(booking.startsAt, customerTz)}</strong>
          was cancelled.</p>
          <p>You can pick a new time any time on the
          <a href="https://gateling.com/contact?tab=book">booking page</a>.</p>
          <p>— Gateling Solutions</p>
        `,
      });
    }
    return { notified: true };
  },
);
