# Inngest Offload Policy

## Rule

**Any server operation that does not require an immediate response to the client MUST be offloaded to an Inngest background job.**

Never do any of the following inline inside a tRPC mutation or server action:
- Send email (Nodemailer / SMTP)
- Make HTTP requests to external services (search engine pings, webhooks)
- Broadcast to subscribers
- Resize or post-process uploaded images
- Invalidate CDN cache

Instead: fire an Inngest event, return success to the client immediately, and let the Inngest function handle retries, logging, and failures.

## Why

1. **User experience** — The user gets a fast response. Email delivery (500ms–3s) becomes invisible.
2. **Reliability** — Inngest retries failed jobs automatically. A transient SMTP error does not break the mutation.
3. **Observability** — Every job is visible in the Inngest dashboard with logs and retry history.
4. **Decoupling** — Mutations stay simple. Side-effects evolve independently.

## Event Catalog

Defined in `src/integrations/inngest/client.ts`:

| Event Name | Payload | Fired By |
|-----------|---------|---------|
| `lead/submitted` | `{ leadId: string }` | `leads` router on create |
| `subscriber/created` | `{ subscriberId: string }` | `subscribers` router on create |
| `case-study/published` | `{ caseStudyId: string; slug: string }` | `case-studies` router on publish |
| `blog-post/published` | `{ blogPostId: string; slug: string }` | `blog-posts` router on publish |
| `user/registered` | `{ userId: string; role: string }` | auth sign-up on user creation |
| `lead/status-changed` | `{ leadId: string; newStatus: string }` | `leads` router on status update |
| `booking/confirmed` | `{ bookingId; startsAt }` | `bookings` router on book / confirm / reschedule |
| `booking/requested` | `{ bookingId }` | `bookings` router on custom-time request |
| `booking/cancelled` | `{ bookingId; cancelledBy }` | `bookings` router on cancel |
| `lead/demo-scheduled` | `{ leadId; activityId; scheduledAt }` | `sales` router when a `demo_scheduled` activity is logged |
| `meetings/webhook.received` | verified Meetings delivery (event `id` = delivery id, dedupes retries) | `POST /api/meetings-webhook` |

## Function Locations

`src/integrations/inngest/functions/`:
- `on-lead-submitted.ts` — email to `info@gateling.com` + auto-reply to visitor
- `on-subscriber-created.ts` — confirmation email with unsubscribe link
- `on-case-study-published.ts` — ping Google IndexNow for `/work/[slug]`
- `on-blog-post-published.ts` — ping Google IndexNow + build newsletter digest for subscribers
- `on-user-registered.ts` — welcome email; customer role gets Gateling intro email
- `on-lead-status-changed.ts` — notify admin when status changes to `qualified`
- `on-booking-confirmed.ts` — provision the Meetings room, confirmation + staff emails, 24 h / 1 h reminders
- `on-booking-cancelled.ts` — delete the Meetings room, notify the other party
- `on-lead-demo-scheduled.ts` — provision / move the prospect's demo room
- `on-meetings-webhook.ts` — `meeting.ended` with a guest → booking `completed`

External HTTP to Meetings goes through `src/integrations/meetings` (registry block — see `docs/meetings-integration.md`) and only ever runs inside these functions.

## Pattern in a Mutation

```ts
// in mutations.ts
export async function createLead(db: Db, inngest: Inngest, input: CreateLeadInput) {
  const [lead] = await db.insert(leadsTable).values(input).returning();
  
  // Fire and forget — Inngest handles delivery + retries
  await inngest.send({ name: "lead/submitted", data: { leadId: lead.id } });
  
  return lead;
}
```

Do NOT `await` email sending inline. Do NOT catch SMTP errors inline.

## Inngest Setup

- Webhook endpoint: `src/app/api/inngest/route.ts`
- Client: `src/integrations/inngest/client.ts`
- All functions registered in `src/integrations/inngest/index.ts`
- Environment vars: `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`
