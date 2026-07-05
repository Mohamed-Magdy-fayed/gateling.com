import { and, eq, lte } from "drizzle-orm";

import { db } from "@/drizzle";
import { BookingsTable } from "@/drizzle/schema";
import {
  escapeHtml,
  formatBookingTime,
} from "@/features/system/bookings/lib/format";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import { sendMail } from "@/integrations/email";
import { inngest } from "../client";
import { getContactEmail } from "./booking-helpers";

/**
 * Daily digest of past confirmed bookings still awaiting completed/no-show
 * triage, so the admin list doesn't silently rot.
 */
export const bookingTriageDigest = inngest.createFunction(
  { id: "booking-triage-digest", triggers: [{ cron: "0 5 * * *" }] },
  async () => {
    const pastDue = await db
      .select({
        name: BookingsTable.name,
        email: BookingsTable.email,
        startsAt: BookingsTable.startsAt,
      })
      .from(BookingsTable)
      .where(
        and(
          eq(BookingsTable.status, "confirmed"),
          lte(BookingsTable.endsAt, new Date()),
        ),
      );
    if (pastDue.length === 0) return { pastDue: 0 };

    const settings = await getBookingSettings(db);
    const items = pastDue
      .map(
        (b) =>
          `<li>${escapeHtml(b.name)} (${escapeHtml(b.email)}) — ${formatBookingTime(b.startsAt, settings.timezone)}</li>`,
      )
      .join("");

    await sendMail({
      to: await getContactEmail(),
      subject: `${pastDue.length} past call(s) need triage — completed or no-show?`,
      html: `
        <h2>Bookings awaiting triage</h2>
        <ul>${items}</ul>
        <p>Mark them completed or no-show from the
        <a href="https://gateling.com/bookings">bookings dashboard</a>.</p>
      `,
    });
    return { pastDue: pastDue.length };
  },
);
