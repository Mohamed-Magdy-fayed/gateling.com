import { db } from "@/drizzle";
import {
  escapeHtml,
  formatBookingTime,
} from "@/features/system/bookings/lib/format";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import { sendMail } from "@/integrations/email";
import { bookingRequestedEvent, inngest } from "../client";
import { getBooking, getContactEmail } from "./booking-helpers";

export const onBookingRequested = inngest.createFunction(
  { id: "on-booking-requested", triggers: [bookingRequestedEvent] },
  async ({ event }) => {
    const booking = await getBooking(event.data.bookingId);
    if (!booking || booking.status !== "requested") return { skipped: true };

    const settings = await getBookingSettings(db);
    const businessTime = formatBookingTime(booking.startsAt, settings.timezone);
    const customerTz = booking.timezone || settings.timezone;
    const name = escapeHtml(booking.name);
    const phone = booking.phone ? escapeHtml(booking.phone) : "—";
    const note = booking.customerNote ? escapeHtml(booking.customerNote) : "—";

    await sendMail({
      to: await getContactEmail(),
      subject: `Custom call time requested: ${name} — ${businessTime}`,
      html: `
        <h2>Custom call time request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${escapeHtml(booking.email)}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Requested time:</strong> ${businessTime}</p>
        <p><strong>Customer timezone:</strong> ${escapeHtml(customerTz)}</p>
        <p><strong>Note:</strong></p>
        <blockquote>${note}</blockquote>
        <p>Confirm or decline it from the
        <a href="https://gateling.com/bookings">bookings dashboard</a>.</p>
      `,
    });

    await sendMail({
      to: booking.email,
      subject: "We received your call request — Gateling Solutions",
      html: `
        <h2>Thanks, ${name}!</h2>
        <p>We received your request for
        <strong>${formatBookingTime(booking.startsAt, customerTz)}</strong>.</p>
        <p>We'll confirm it shortly by email, or suggest another time if that
        one isn't possible.</p>
        <p>— Gateling Solutions</p>
      `,
    });
    return { notified: true };
  },
);
