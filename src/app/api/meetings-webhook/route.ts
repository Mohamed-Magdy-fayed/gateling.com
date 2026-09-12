import {
  inngest,
  meetingsWebhookReceivedEvent,
} from "@/integrations/inngest/client";
import { createMeetingsWebhookHandler } from "@/integrations/meetings/webhook";

/**
 * Inbound lifecycle events from Gateling Meetings. Verified here (signature +
 * replay window), processed in `on-meetings-webhook`. The delivery id is
 * reused as the Inngest event id, so Meetings' retries never run twice.
 */
export const POST = createMeetingsWebhookHandler({
  secret: process.env.MEETINGS_WEBHOOK_SECRET,
  onDelivery: async (delivery) => {
    // Only the end of a call changes anything here; the other lifecycle
    // events (started, participant joined/left) are acknowledged and dropped.
    if (delivery.event !== "meeting.ended") return;
    await inngest.send({
      ...meetingsWebhookReceivedEvent.create({
        id: delivery.id,
        event: delivery.event,
        createdAt: delivery.createdAt,
        data: {
          meeting: {
            code: delivery.data.meeting.code,
            externalRef: delivery.data.meeting.externalRef,
            status: delivery.data.meeting.status,
            endedAt: delivery.data.meeting.endedAt,
          },
          endedBy: delivery.data.endedBy,
        },
      }),
      id: delivery.id,
    });
  },
});
