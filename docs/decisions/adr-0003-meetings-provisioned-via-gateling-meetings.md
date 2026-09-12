# ADR-0003: Video rooms are provisioned on Gateling Meetings; the website keeps the calendar

- **Date:** 2026-09-12
- **Status:** accepted

## Context

Visitors book calls at `/contact?tab=book` against the website's own
availability engine (`bookings`, `booking_blackouts`, `lib/slots.ts`). Until
now the confirmation email carried a single static `meetingLink` setting — one
room for every call, no per-booking room, nothing for staff to "join as host".

Gateling Meetings (`https://meetings.gateling.com`) is our self-hosted video
platform. It has **no scheduling model** — no availability, event types or
slot arithmetic — but it ships a server-to-server integration API built for
this: create/update/delete a meeting by `externalRef`, an `Idempotency-Key`,
signed single-use host join links, and HMAC-signed lifecycle webhooks. The
same API is meant to be consumed by every Gateling system (Atelier, TMS, …),
so whatever the website does must be repeatable elsewhere without re-thinking.

## Decision

We will **keep scheduling on the website and provision a room on Meetings per
scheduled thing**, through a reusable block installed from the Gateling
registry (`npx shadcn@latest add @gateling/meetings-integration`):

- **Bookings:** `booking/confirmed` creates (or, on reschedule, moves) the room
  as the first Inngest step, before any email; `booking/cancelled` deletes it.
  `bookings.meetingCode` / `meetingGuestUrl` hold the result; emails use the
  room link and fall back to the static setting when provisioning is
  unavailable, so the customer always hears from us.
- **Sales demos:** logging a `demo_scheduled` activity emits
  `lead/demo-scheduled`; one room per lead (`lead:<id>:demo`), stored on
  `leads.demoMeetingCode` / `demoMeetingUrl` — not on `lead_activities`, which
  is append-only by contract. The lead page shows the guest link (staff share
  it on WhatsApp; the pipeline sends nothing itself) and a host button.
- **One host identity** for the whole site (`externalId: gateling-website`).
  Meetings only honours a host link whose `externalId` matches the room's
  host, so a per-staff identity would mean only the creator could ever join
  as host. Host links are minted per click by a staff-only procedure and
  never stored.
- **The website owns visitor communication.** Rooms are created with no
  `invitees`; our bilingual confirmation and 24 h / 1 h reminders carry the
  link. Meetings' own invite/reminder emails are English-only and would
  duplicate ours.
- **Closing the loop:** `meeting.ended` with a guest participant marks the
  booking `completed`; no guest leaves it for the deliberate no-show flow.
  Deliveries are verified on the raw body, replay-limited, and deduplicated by
  reusing the delivery id as the Inngest event id.

## Alternatives considered

- **Move scheduling into Meetings (Cal.com-style):** Meetings would need
  availability, blackouts, business hours and slot logic the website already
  has and tunes; every consumer would then depend on Meetings for its calendar.
  Rejected — rooms are the shared concern, calendars are per product.
- **Per-staff host identities:** truer attribution in the Meetings dashboard,
  but a booking has no assignee and a host link for anyone else is a 403.
  Rejected until bookings are assigned to people.
- **Let Meetings email the visitor (`invitees`):** gets an `.ics` and a 10-min
  reminder for free, but from a second sender, in English only, on top of
  ours. Rejected; an `.ics` in our own email is a follow-up.
- **Store meeting refs on `lead_activities`:** would break the table's
  append-only invariant for a value that is current state, not history.
- **Copy `docs/client.ts` by hand into each system (previous convention):**
  works, but drifts. The registry block is the same files with one install
  command, shipped tests, and one place to bump the API version.

## Consequences

- Every Gateling system integrates the same way: install the block, paste the
  API URL / key / webhook secret on the admin settings page (the `settings`
  table, codes `00018`–`00020` — not env vars, so no redeploy and the same flow
  as WaPilot), call `ensureScheduledMeeting` / `cancelScheduledMeeting` from a
  job, mint host links in a procedure, hand webhooks to the queue.
- The Meetings API contract now has consumers; breaking changes there follow
  the API-evolution rule in `standards/api.md` and a bump of the block.
- Rooms created by the website all belong to one linked host account on
  Meetings; the attendance log and "Back to Gateling" behaviour are per room.
- No API key set on `/settings` means no rooms and the static-link fallback —
  the site keeps working in every environment without keys.
