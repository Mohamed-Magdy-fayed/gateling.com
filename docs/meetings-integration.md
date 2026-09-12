# Meetings integration

Every call booked on the site and every scheduled sales demo gets its own room
on Gateling Meetings (`https://meetings.gateling.com`). The website keeps the
calendar; Meetings provides the room. Rationale and rejected alternatives:
[ADR-0003](decisions/adr-0003-meetings-provisioned-via-gateling-meetings.md).

The client, helpers and webhook receiver are the `@gateling/meetings-integration`
registry block — the same files every Gateling system installs. **Do not edit
`src/integrations/meetings/*` here**; change the block in `gateling-registry`
and re-run `npx shadcn@latest add @gateling/meetings-integration --overwrite`
(then re-apply `onDelivery` in the route, which is a starter you own).

## Flows

| Trigger | What happens | Where |
|---|---|---|
| `booking/confirmed` (book, staff confirm, reschedule) | Step `provision-meeting`: create, or `PATCH` the time when `meetingCode` exists (`externalRef booking:<id>`); persist `meetingCode` + `meetingGuestUrl`; then the confirmation email carries the room link | `src/integrations/inngest/functions/on-booking-confirmed.ts`, `src/features/system/bookings/server/meeting.ts` |
| `booking/cancelled` | Step `cancel-meeting` deletes the room (already-gone is fine; a Meetings outage is logged and the emails still go out) | `on-booking-cancelled.ts` |
| Staff → **Create meeting room** (bookings table, confirmed + upcoming + no room) | `bookings.requestMeeting` emits `booking/meeting-requested` → provisioning only, no emails. This is the backfill for pre-integration bookings and the retry for a room whose provisioning failed. A failed enqueue is shown to staff with the queue's error. | `bookings/server/router.ts`, `on-booking-meeting-requested.ts` |
| Staff → **Join as host** (bookings table) | `bookings.hostJoinLink` mints a single-use host link, browser opens it | `bookings/server/router.ts`, `admin/components/booking-row-actions.tsx` |
| Customer → **Join call** (My Account) | Plain guest link; waiting room on, host admits | `my-account/_components/my-bookings.tsx` |
| `sales.logActivity` `demo_scheduled` (+ demo time) | Emits `lead/demo-scheduled` → room `lead:<id>:demo` (45 min), stored on `leads.demoMeetingCode/Url`; a later `demo_scheduled` moves it, and a retried run for an older log stands down | `sales/server/router.ts`, `on-lead-demo-scheduled.ts`, `sales/server/meeting.ts` |
| Lead page **Demo meeting** card | Copy the guest link for WhatsApp; **Join as host** via `sales.demoHostJoinLink` | `sales/admin/components/demo-meeting-card.tsx` |
| Meetings → `POST /api/meetings-webhook` | Verify signature + 5-min replay window (bodies over 64 KB rejected) → only `meeting.ended` is forwarded to Inngest as `meetings/webhook.received` (event id = delivery id, so retries dedupe) → the booking that owns the room is marked `completed` **only if** it is still confirmed, the room ended after the slot started, and both a host and a guest were in it (`decideBookingCompletion`); the write is a compare-and-set | `src/app/api/meetings-webhook/route.ts`, `on-meetings-webhook.ts`, `bookings/server/meeting.ts` |

Host identity is the single linked user `gateling-website` (name "Gateling
Solutions", email = contact-email setting), owned by
`src/features/system/meetings/host.ts`. **Any staff member can mint a host
link for any room** because of that — by design, see the ADR for why not
per-staff. Meetings therefore only ever sees "gateling-website" as the host;
the website logs `meetings.host_link_minted { userId, bookingId | leadId,
meetingCode }` on every mint as the audit record of who hosted what.

## Configuration

Created once at `https://meetings.gateling.com/settings/integrations`:

| Field | Value |
|---|---|
| Name / Slug | Gateling.com / `gateling-com` |
| Webhook URL | `https://gateling.com/api/meetings-webhook` |
| Allowed return origins | `https://gateling.com` |

Then on Vercel (and `.env` locally):

```
MEETINGS_API_URL=https://meetings.gateling.com
MEETINGS_API_KEY=gm_live_…
MEETINGS_WEBHOOK_SECRET=whsec_…
```

Validated in `src/env/server.ts`: all optional; a key without URL + secret
fails startup. "Rotate key" on Meetings re-issues key **and** secret — update
both together.

## Failure modes

- **Not configured** (`MEETINGS_API_KEY` empty): `getMeetingsClient()` is
  `null`; every step reports `skipped: meetings_not_configured`; emails use the
  static `BOOKING_MEETING_LINK` setting; Join buttons stay hidden (no code).
- **Meetings API down at confirmation:** Inngest retries `provision-meeting`;
  after the last retry the `StepError` is logged and the run continues — the
  confirmation email still goes out with the fallback link. The room is not
  retried later; staff can confirm → cancel → re-book, or the customer can
  reschedule (which re-runs provisioning).
- **Stale room** (deleted/ended on Meetings while the booking is live): the
  next provisioning falls through to *create* and overwrites the stored code.
- **Webhook without a configured secret:** endpoint answers a bare 503, so
  Meetings keeps retrying (6 attempts over ~1 h) instead of dropping the event.
- **Room ended but the call didn't happen** (staff tested the link the day
  before, or only one side joined): the booking stays `confirmed` — reminders
  and join buttons keep working — and staff decide with the manual
  completed / no-show actions.
- **Inngest keys** are required on the production deployment
  (`VERCEL_ENV=production`, checked in `src/env/server.ts`): an unsigned
  Inngest endpoint would let anyone run the webhook handler directly.

## Testing

```bash
npm run test:unit                              # includes the block's own specs + bookings/server/meeting.test.ts
npx playwright test e2e/meetings-access.spec.ts # host-link procedures and webhook closed to the public
```

Local end-to-end against Meetings: run its stack (`npm run db:start && npm run
livekit && npm run inngest && npm run dev` in `G:\apps\gateling-meetings`),
create an integration at `/settings/integrations` with webhook URL
`http://localhost:3000/api/meetings-webhook` (adjust ports), point this app's
`MEETINGS_*` at it, and book a slot.

## Not built (follow-ups)

Availability sync from Meetings (rooms created elsewhere are invisible here) ·
per-staff host identities · `.ics` attachment in our emails · cancelling a
demo room when a lead is parked/lost.
