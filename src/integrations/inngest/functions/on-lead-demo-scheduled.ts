import { eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { LeadsTable } from "@/drizzle/schema";
import { getBookingSettings } from "@/features/system/bookings/lib/settings";
import { websiteMeetingHost } from "@/features/system/bookings/server/meeting";
import { provisionLeadDemoMeeting } from "@/features/system/sales/server/meeting";
import { getMeetingsClient } from "@/integrations/meetings";
import { inngest, leadDemoScheduledEvent } from "../client";
import { getContactEmail } from "./booking-helpers";

/**
 * A `demo_scheduled` activity was logged: open (or move) the prospect's demo
 * room. The lead page then shows the guest link and a "Join as host" button.
 */
export const onLeadDemoScheduled = inngest.createFunction(
  { id: "on-lead-demo-scheduled", triggers: [leadDemoScheduledEvent] },
  async ({ event, step }) => {
    return step.run("provision-demo-meeting", async () => {
      const client = getMeetingsClient();
      if (!client) return { skipped: "meetings_not_configured" };

      const lead = await db.query.LeadsTable.findFirst({
        where: eq(LeadsTable.id, event.data.leadId),
        columns: {
          id: true,
          kind: true,
          name: true,
          demoMeetingCode: true,
          demoMeetingUrl: true,
        },
      });
      if (!lead || lead.kind !== "prospect") return { skipped: "not_prospect" };

      const scheduledAt = new Date(event.data.scheduledAt);
      if (scheduledAt <= new Date()) return { skipped: "in_the_past" };

      const { timezone } = await getBookingSettings(db);
      const host = websiteMeetingHost(await getContactEmail());
      const { code, action } = await provisionLeadDemoMeeting(
        db,
        client,
        lead,
        scheduledAt,
        timezone,
        host,
      );
      return { code, action };
    });
  },
);
