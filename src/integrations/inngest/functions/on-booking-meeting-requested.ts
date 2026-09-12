import { db } from "@/drizzle";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import { provisionBookingMeeting } from "@/features/system/bookings/server/meeting";
import { getWebsiteMeetingHost } from "@/features/system/meetings/host";
import { getMeetingsClient } from "@/integrations/meetings";
import { bookingMeetingRequestedEvent, inngest } from "../client";
import { getBooking } from "./booking-helpers";

/**
 * Staff asked for a room on a confirmed booking that has none. Provisioning
 * only — the customer was already emailed when the booking was confirmed;
 * the link reaches them through the reminders and My Account.
 */
export const onBookingMeetingRequested = inngest.createFunction(
  {
    id: "on-booking-meeting-requested",
    triggers: [bookingMeetingRequestedEvent],
  },
  async ({ event, step }) => {
    return step.run("provision-meeting", async () => {
      const booking = await getBooking(event.data.bookingId);
      if (!booking || booking.status !== "confirmed")
        return { skipped: "not_confirmed" };
      if (booking.endsAt <= new Date()) return { skipped: "in_the_past" };
      if (booking.meetingCode) return { skipped: "has_meeting" };

      const client = getMeetingsClient();
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
  },
);
