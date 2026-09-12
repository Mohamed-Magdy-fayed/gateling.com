import { StepError } from "inngest";

import { db } from "@/drizzle";
import {
  escapeHtml,
  formatBookingTime,
} from "@/features/system/bookings/lib/format";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import {
  bookingMeetingLink,
  provisionBookingMeeting,
} from "@/features/system/bookings/server/meeting";
import { resolveMeetingsClient } from "@/features/system/meetings/config";
import { getWebsiteMeetingHost } from "@/features/system/meetings/host";
import { sendMail } from "@/integrations/email";
import { bookingConfirmedEvent, inngest } from "../client";
import { getBooking, getContactEmail } from "./booking-helpers";

/** Booking as of now, only if this event's confirmation is still current. */
async function getCurrentBooking(bookingId: string, eventStartsAt: string) {
  const booking = await getBooking(bookingId);
  if (!booking) return null;
  if (booking.status !== "confirmed") return null;
  // A reschedule emits a fresh confirmed event; the old run must stand down.
  if (booking.startsAt.toISOString() !== eventStartsAt) return null;
  return booking;
}

function meetingLine(link: string | null, fallback: string) {
  if (!link) return fallback;
  const safe = escapeHtml(link);
  return `<p><strong>Join here:</strong> <a href="${safe}">${safe}</a></p>`;
}

export const onBookingConfirmed = inngest.createFunction(
  { id: "on-booking-confirmed", triggers: [bookingConfirmedEvent] },
  async ({ event, step, logger }) => {
    // Provision (or move) the Meetings room first so the confirmation email
    // can carry the real link. Retried by Inngest; if it still fails, the
    // customer must still hear from us, so the email falls back to the static
    // link rather than the whole run dying.
    try {
      await step.run("provision-meeting", async () => {
        const booking = await getCurrentBooking(
          event.data.bookingId,
          event.data.startsAt,
        );
        if (!booking) return { skipped: "stale" };
        const client = await resolveMeetingsClient(db);
        if (!client) return { skipped: "meetings_not_configured" };

        const settings = await getBookingSettings(db);
        const host = await getWebsiteMeetingHost(db);
        const { code, action } = await provisionBookingMeeting(
          db,
          client,
          booking,
          settings,
          host,
        );
        return { code, action };
      });
    } catch (error) {
      if (!(error instanceof StepError)) throw error;
      logger.error("booking meeting provisioning failed", {
        bookingId: event.data.bookingId,
        error: error.message,
      });
    }

    const initial = await step.run("send-confirmation", async () => {
      const booking = await getCurrentBooking(
        event.data.bookingId,
        event.data.startsAt,
      );
      if (!booking) return { skipped: true };

      const settings = await getBookingSettings(db);
      const customerTz = booking.timezone || settings.timezone;
      const customerTime = formatBookingTime(booking.startsAt, customerTz);
      const businessTime = formatBookingTime(
        booking.startsAt,
        settings.timezone,
      );
      const name = escapeHtml(booking.name);
      const phone = booking.phone ? escapeHtml(booking.phone) : "—";
      const note = booking.customerNote
        ? escapeHtml(booking.customerNote)
        : "—";
      const link = bookingMeetingLink(booking, settings);

      await sendMail({
        to: booking.email,
        subject: "Your call is confirmed — Gateling Solutions",
        html: `
          <h2>Your call is confirmed, ${name}!</h2>
          <p><strong>When:</strong> ${customerTime}</p>
          ${meetingLine(link, `<p>We'll send you the meeting link before the call.</p>`)}
          <p>Need to change it? Manage your booking from the
          <a href="https://gateling.com/my-account">My Account</a> page.</p>
          <p>— Gateling Solutions</p>
        `,
      });

      await sendMail({
        to: await getContactEmail(),
        subject: `Call booked: ${name} — ${businessTime}`,
        html: `
          <h2>New call booking</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>When:</strong> ${businessTime}</p>
          <p><strong>Customer timezone:</strong> ${escapeHtml(customerTz)}</p>
          <p><strong>Note:</strong> ${note}</p>
          ${meetingLine(link, "")}
          <p>Join as host from the bookings page — host links are minted per click.</p>
        `,
      });
      return { skipped: false };
    });
    if (initial.skipped) return { skipped: true };

    const startsAt = new Date(event.data.startsAt);
    const reminders = [
      { id: "24h", offsetMs: 24 * 60 * 60 * 1000 },
      { id: "1h", offsetMs: 60 * 60 * 1000 },
    ];

    for (const reminder of reminders) {
      const remindAt = new Date(startsAt.getTime() - reminder.offsetMs);
      if (remindAt <= new Date()) continue;
      await step.sleepUntil(`sleep-${reminder.id}`, remindAt);

      await step.run(`reminder-${reminder.id}`, async () => {
        const booking = await getCurrentBooking(
          event.data.bookingId,
          event.data.startsAt,
        );
        if (!booking) return { skipped: true };

        const settings = await getBookingSettings(db);
        const customerTz = booking.timezone || settings.timezone;
        const customerTime = formatBookingTime(booking.startsAt, customerTz);
        const link = bookingMeetingLink(booking, settings);

        await sendMail({
          to: booking.email,
          subject: `Reminder: your call with Gateling — ${customerTime}`,
          html: `
            <h2>Upcoming call reminder</h2>
            <p>Hi ${escapeHtml(booking.name)}, your call is coming up.</p>
            <p><strong>When:</strong> ${customerTime}</p>
            ${meetingLine(link, "")}
            <p>— Gateling Solutions</p>
          `,
        });
        return { skipped: false };
      });
    }
    return { done: true };
  },
);
