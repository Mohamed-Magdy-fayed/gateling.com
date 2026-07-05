import { db } from "@/drizzle";
import {
  escapeHtml,
  formatBookingTime,
} from "@/features/system/bookings/lib/format";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
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

export const onBookingConfirmed = inngest.createFunction(
  { id: "on-booking-confirmed", triggers: [bookingConfirmedEvent] },
  async ({ event, step }) => {
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
      const meetingLink = settings.meetingLink
        ? escapeHtml(settings.meetingLink)
        : null;
      const meetingLine = meetingLink
        ? `<p><strong>Join here:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
        : `<p>We'll send you the meeting link before the call.</p>`;

      await sendMail({
        to: booking.email,
        subject: "Your call is confirmed — Gateling Solutions",
        html: `
          <h2>Your call is confirmed, ${name}!</h2>
          <p><strong>When:</strong> ${customerTime}</p>
          ${meetingLine}
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
        const meetingLink = settings.meetingLink
          ? escapeHtml(settings.meetingLink)
          : null;
        const meetingLine = meetingLink
          ? `<p><strong>Join here:</strong> <a href="${meetingLink}">${meetingLink}</a></p>`
          : "";

        await sendMail({
          to: booking.email,
          subject: `Reminder: your call with Gateling — ${customerTime}`,
          html: `
            <h2>Upcoming call reminder</h2>
            <p>Hi ${escapeHtml(booking.name)}, your call is coming up.</p>
            <p><strong>When:</strong> ${customerTime}</p>
            ${meetingLine}
            <p>— Gateling Solutions</p>
          `,
        });
        return { skipped: false };
      });
    }
    return { done: true };
  },
);
