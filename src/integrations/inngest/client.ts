import { eventType, Inngest } from "inngest";
import { z } from "zod";

export const inngest = new Inngest({ id: "gateling" });

export const leadSubmittedEvent = eventType("lead/submitted", {
  schema: z.object({ leadId: z.string() }),
});

export const subscriberCreatedEvent = eventType("subscriber/created", {
  schema: z.object({ subscriberId: z.string() }),
});

export const caseStudyPublishedEvent = eventType("case-study/published", {
  schema: z.object({ caseStudyId: z.string(), slug: z.string() }),
});

export const blogPostPublishedEvent = eventType("blog-post/published", {
  schema: z.object({ blogPostId: z.string(), slug: z.string() }),
});

export const userRegisteredEvent = eventType("user/registered", {
  schema: z.object({ userId: z.string(), role: z.string() }),
});

export const leadStatusChangedEvent = eventType("lead/status-changed", {
  schema: z.object({ leadId: z.string(), newStatus: z.string() }),
});

export const bookingConfirmedEvent = eventType("booking/confirmed", {
  schema: z.object({ bookingId: z.string(), startsAt: z.string() }),
});

export const bookingRequestedEvent = eventType("booking/requested", {
  schema: z.object({ bookingId: z.string() }),
});

/** Staff asked for a Meetings room on a booking that has none (backfill / retry). */
export const bookingMeetingRequestedEvent = eventType(
  "booking/meeting-requested",
  { schema: z.object({ bookingId: z.string() }) },
);

export const bookingCancelledEvent = eventType("booking/cancelled", {
  schema: z.object({
    bookingId: z.string(),
    cancelledBy: z.enum(["customer", "admin"]),
  }),
});

export const leadDemoScheduledEvent = eventType("lead/demo-scheduled", {
  schema: z.object({
    leadId: z.string(),
    activityId: z.string(),
    scheduledAt: z.string(),
  }),
});

/** A verified delivery from Gateling Meetings; `id` doubles as the Inngest event id for dedupe. */
export const meetingsWebhookReceivedEvent = eventType(
  "meetings/webhook.received",
  {
    schema: z.object({
      id: z.string(),
      event: z.string(),
      createdAt: z.string(),
      data: z.object({
        meeting: z.object({
          code: z.string(),
          externalRef: z.string().nullable(),
          status: z.string(),
          endedAt: z.string().nullable(),
        }),
        endedBy: z.string().optional(),
      }),
    }),
  },
);
