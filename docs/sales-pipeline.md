# Sales Pipeline (internal)

Staff-only outbound prospecting module. Replaces the spreadsheet workflow
(`Call_Sheet_*.xlsx`). **Not customer-facing** — excluded from public nav,
`robots.txt` and the sitemap.

See [ADR-0002](decisions/adr-0002-sales-pipeline-on-shared-leads-table.md) for
why it shares the `leads` table.

## Routes

| Route | Purpose |
|---|---|
| `/sales/today` | **The point of the module.** Computed call list, five buckets. |
| `/sales/leads` | Full prospect table: filter, search, create, edit. |
| `/sales/leads/[id]` | Detail + append-only activity timeline. |

Admin-only. Enforced in three independent places — a route guard alone is not
authorisation:

1. `src/proxy.ts` — screen-permission check. **Load-bearing:**
   `getProtectedScreenDefinitionByPathname` returns `undefined` for paths not in
   `SYSTEM_SCREEN_DEFINITIONS` and the middleware then lets the request through.
   The `sales` entry with `pathPrefixes: ["/sales"]` is what protects it.
2. `(system-pages)/layout.tsx` — redirects anonymous requests to `/sign-in`.
3. `assertAdmin()` in the sales tRPC router — procedures are reachable directly.

`sales` is in `EMPLOYEE_BLOCKED_SCREENS`, so employees get `/unauthorized`.

## Structure

```
src/features/system/sales/
  lib/today-rules.ts     ← pure bucket logic, `now` injected, no DB
  lib/derived.ts         ← pure derivation of the cached columns
  lib/pipeline-status.ts ← closed statuses, promise discharge, do-not-contact rule
  lib/recompute-plan.ts  ← pure planning for `sales:recompute`
  lib/calling-window.ts  ← Cairo business-hours advice
  server/service.ts      ← ALL business logic (server-only)
  server/errors.ts       ← `SalesError` + router mapping
  server/recompute.ts    ← shared with the CLIs (NOT server-only — see below)
  cli/recompute-derived.ts ← `npm run sales:recompute`
  server/schemas.ts      ← Zod inputs, shared by router and any future caller
  server/router.ts       ← thin tRPC wrapper: authorise, delegate
  admin/                 ← pages and components
  translations/          ← sales-en.ts + sales-ar.ts
```

**Business logic never lives in a route handler or a component.** The service
layer takes typed inputs and a `db` handle, so the planned MCP wrapper calls the
same functions the UI calls.

`server/recompute.ts` is deliberately *not* marked `server-only`: the seed CLI
runs under tsx in plain Node where that guard throws, and duplicating the
derivation would let imported leads drift from logged ones.

## Bucket rules

Fixed order; a lead appears in **at most one** bucket (first match wins).
Thresholds live in `TodayRulesConfig` and are meant to be tuned.

| # | Bucket | Rule |
|---|---|---|
| 1 | Rescue | `demo_agreed`, no `demo_scheduled` activity, last contact > 2 days (never contacted counts as stale) |
| 2 | Overdue commitment | any `nextActionAt` in the past that is unfulfilled |
| 3 | Follow-up due | `awaiting_reply`, last contact > 3 days, `followUpCount < 2` |
| 4 | New queue | `new`, not do-not-contact, has a phone — ordered tier A→C then followers desc, **capped** |
| 5 | Auto-park candidates | `followUpCount >= 2` and no inbound reply — offers one-click Park |

Enforced, not merely displayed: `doNotContact` leads and closed leads
(`TERMINAL_PIPELINE_STATUSES` in `lib/pipeline-status.ts`: `lost`, `won`,
`parked`, `blocked_no_number`) are filtered out of **every** bucket, Auto-park
included; the cap is applied inside the rules module, not the UI.

The `followUpCount >= 2` cutoff is a **safety limit, not a preference** —
chasing past two unanswered WhatsApp messages risks a ban on the business
number.

## Working the Today page

`/sales/today` is a guided session: one pinned **Up next** lead, one primary
action, outcome buttons that log in one tap, then the next lead. The tables
below are read from `lib/outcomes.ts` and `lib/today-shortcuts.ts`, which the
UI and the `?` panel also read, so they cannot drift.

| Bucket | Primary action | Outcome set shown |
|---|---|---|
| Rescue, Overdue, New queue | Call | Call set |
| Follow-up due | WhatsApp if `whatsappStatus = confirmed`, else Call | WhatsApp set / Call set |
| Auto-park | Park | Auto-park set (never another outbound message) |
| any, no phone | Open lead (Call/WhatsApp disabled with a reason) | — |

Pressing Call or WhatsApp (or the Call/WhatsApp switch) changes the outcome
set. Every outcome is one `sales.logActivity` call (or `sales.park`):

| Outcome | Type | Channel | New status | Needs time |
|---|---|---|---|---|
| Interested | `demo_agreed` | phone | `demo_agreed` | |
| Book demo | `demo_scheduled` | phone | `demo_scheduled` | demo time |
| Call back | `call` | phone | `callback_scheduled` | call-back time |
| No answer | `no_answer` | phone | `awaiting_reply` | |
| Not interested ↶ | `call` | phone | `lost` | |
| Wrong number ↶ | `call_unclear` | phone | `blocked_no_number` | |
| Sent | `whatsapp_sent` | whatsapp | `awaiting_reply` | |
| Replied | `whatsapp_reply` | whatsapp | `contacted` | |
| Park ↶ (Auto-park) | via `sales.park` | — | `parked` | |
| They replied (Auto-park) | `whatsapp_reply` | whatsapp | `contacted` | |
| Answered a call (Auto-park) | `call` | phone | `contacted` | |

↶ = offers **Undo** for 5 s. Undo is compensating, not a deletion: it logs a
`status_change` back to the previous status, carrying the previous
`nextActionAt` so a discharged promise returns. The timeline shows both rows.
Times are entered in business time (Cairo); presets already past are hidden
and a past time is refused.

| Key (`event.code`, so any layout) | Action | Ignored when |
|---|---|---|
| `C` | Start call: dials on a touch device, copies the number on a computer | no phone, Auto-park |
| `W` | Open WhatsApp | no WhatsApp link, Auto-park |
| `1`–`9` (and numpad) | The numbered visible outcome | beyond the visible count, time picker open |
| `S` | Skip for now (persists for the local day) | — |
| `?` | Shortcut list, with an on/off switch | — |

All keys are ignored while typing in a field, in an open dialog/menu, or
with Ctrl/Alt/Meta. Hints and the `?` panel are hidden on touch screens.

**Progress** = `doneToday` (distinct leads with any activity today) of
`done + left`, where *left* counts the remaining bucket rows with the new
queue limited to today's goal (`newQueueCap − newTouchedToday`); new leads
beyond the goal show as "Extra (daily goal met)". A lead logged today that is
due again the same day counts in both, so the bar can dip — accepted.
"Conversations today" (answered call, reply, demo agreed/booked) sits beside
it so parks alone cannot fill the headline. The session state (pinning,
skips, stale-refetch guard) is the pure reducer in `lib/today-session.ts`.

**Why build, not buy:** the pipeline already owns the bucket rules, the
WhatsApp follow-up safety limit, Meetings demo provisioning and bilingual
RTL; an external CRM would duplicate all four.

**Baseline** (read-only; before the redesign ships and two weeks after):

```bash
psql "$DATABASE_URL" -v sprint_start="'<SPRINT_START>'" -f docs/queries/sales-baseline.sql
```

## Derived values

Never hand-maintained. Cached on `leads` for query performance and recomputed
from `lead_activities` by `recomputeLeadDerived()` after every append:

- `lastContactedAt` — latest contact-type activity. **`demo_agreed` is a contact
  type**; without it the Rescue bucket cannot see leads that agreed to a demo.
- `followUpCount` — unanswered attempts (`whatsapp_sent`, `no_answer`,
  `call_unclear`) since the last conversation. A conversation —
  `whatsapp_reply`, an answered `call`, `demo_agreed`, `demo_scheduled`,
  `demo_done` — resets it to 0.
- `nextActionAt` — earliest unfulfilled promise. Discharged by stamping
  `nextActionDoneAt`, never by editing history: on any contact activity, and
  on any log that moves the lead to a closed status.

`lead_activities` is **append-only**. The service layer exposes no update or
delete for it, and must not.

**Rule change, 2026-10-23** (relevant to the sell-first day-14 read, which
should split before/after this date): before it, `followUpCount` counted
answered `call`s as chases and ignored `no_answer`, and lost/won/wrong-number
leads could surface in Auto-park. Existing leads are brought in line once with
`sales:recompute` (below).

Recompute ran on production 2026-10-23 (`a99700c`): 4 of 44 prospects updated, no Today bucket moves.

### Writes and errors

Every activity goes through `logActivity` (own transaction) or
`logActivityInTx` (caller's transaction, for bulk actions); `parkLead` /
`parkLeadInTx` likewise. Each locks the lead row first and throws a
`SalesError` (`server/errors.ts`), which the router maps to tRPC:

| `appCode` | tRPC code | When |
|---|---|---|
| `SALES_LEAD_NOT_PROSPECT` | `NOT_FOUND` | id is unknown or not `kind = 'prospect'` |
| `SALES_DO_NOT_CONTACT` | `PRECONDITION_FAILED` | outbound type (`call`, `no_answer`, `call_unclear`, `whatsapp_sent`) on a do-not-contact lead |

On the Today page a not-found save drops the lead from the session with a
"no longer in the pipeline" toast; a do-not-contact save rolls back with its
own toast; any other failure rolls back (the lead returns, Up next if it was)
with a Retry action.

## Recomputing derived values

Run once after any change to `lib/derived.ts`, so existing leads match what a
fresh log produces. `DATABASE_URL` in `.env` is production: the script prints
the target host, writes nothing without `--yes`, and is idempotent.

```bash
npm run sales:recompute -- --dry-run   # changed-lead count + leads entering/leaving each Today bucket
npm run sales:recompute -- --yes       # write, in 50-lead transactions
```

Review the dry-run output before `--yes`. A failed batch rolls back, prints
the lead id and cause, and the script exits non-zero.

## Configuration

| Setting | Code | Default |
|---|---|---|
| Daily new-dial cap | `00017` | 10 |
| Business timezone (calling window) | `00003` | `Africa/Cairo` |

Calling window: ateliers open ~11:00–12:00, close ~22:00–23:00. Before 12:00
Cairo the page shows a banner advising WhatsApp instead of calls. It advises —
buckets stay visible. Computed server-side so it follows Cairo hours, not the
operator's device clock.

## Seeding

```bash
npm run seed -- sales-leads                      # default CSV path
npm run seed -- sales-leads "path/to/file.csv"   # explicit path
```

Idempotent — matches on `(name, phone)`, updates rather than duplicates, and
appends the seed activity only when the lead has no history. Safe to re-run.

`callback_scheduled` rows get a derived `nextActionAt` (+1 day): the CSV has no
next-action column, and without it a scheduled callback would never surface as
overdue.

**Acceptance:** the shipped CSV yields **2 Rescue / 1 Overdue / 7 Follow-up**.
Asserted in `src/drizzle/seed/import-sales-leads.test.ts` against the real
mapper and derivation, so a mapping regression fails in CI rather than in
production.

## Sourcing new atelier leads

```bash
npm run leads:source -- --dry-run   # request count only, no API calls
npm run leads:source                # Cairo, Giza, Alexandria → daily batch CSVs
npm run leads:source -- --db        # also dedupe against prospects in the DB (read-only)
```

Google Places (New) Text Search, keyed by `GOOGLE_PLACES_API_KEY`. Writes
`batch-YYYYMMDD-NNN.csv` files (10 rows by default, most-reviewed first) and a
`skipped-duplicates-*.csv` to `places-batches/` next to the seed CSV — outside
the repo, since they hold phone numbers. Dedupes by place id, normalised phone
and name + city against the seed CSV, earlier batches and (with `--db`) the
pipeline. Closed and phoneless listings are dropped.

Verify each batch by hand (WhatsApp name, Instagram handle, followers, tier),
then import it with `npm run seed -- sales-leads <batch file>` — **that import
writes to whatever `DATABASE_URL` points at**. Only the business's own Maps
listing is used; Maps Platform terms limit how long Places content may be
kept, so delete batches you will not contact. Logic and tests:
`lib/places-leads.ts`; CLI: `cli/source-atelier-leads.ts`.

## Testing

```bash
npm run test:unit                       # Vitest — rules, derivation, CSV mapping (DB tests skip)
npx playwright test e2e/sales-access.spec.ts   # access control + no public leakage
```

Vitest was added for this module; Playwright still owns `npm test`.

Service tests (`server/service.test.ts`) need a database and run only when
`TEST_DATABASE_URL` is set; `src/test/test-db.ts` refuses the `.env` host.
Use a throwaway container (or a Neon branch):

```bash
docker run -d --rm --name gateling-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=gateling_test -p 55432:5432 postgres:16-alpine
DATABASE_URL=postgresql://postgres:test@localhost:55432/gateling_test npx drizzle-kit migrate
TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/gateling_test npx vitest run src/features/system/sales
```

## Deviations from `entity-blueprint.md`

This module intentionally does not follow the standard entity pattern:

- No `SYSTEM_ENTITY_REGISTRY` entry — `/sales/today` is not a table screen, and
  the pipeline table needs bespoke filters.
- Plain controlled form instead of the `useAppForm` stack — internal tool, no
  validation nuance beyond "name is required", server re-validates with Zod.
- Bespoke table instead of the shared `DataTable` — the Today view is the daily
  surface; this one exists for search and edit.

## Demo meetings

Logging a `demo_scheduled` activity requires a demo time (the next-action
field, relabelled) and provisions a Gateling Meetings room in the background —
one per lead (`lead:<id>:demo`), moved rather than duplicated by a later
`demo_scheduled`. The code and guest link live on `leads.demoMeetingCode` /
`demoMeetingUrl` (not on the append-only activity log). The lead page shows
the link to copy into WhatsApp and a **Join as host** button; the pipeline
still sends nothing itself. Details: [meetings-integration.md](meetings-integration.md).

## Agents (MCP)

An AI agent can run the daily routine with the operator through the sales
MCP server at `/api/mcp/sales` (key with Sales access): read today's queue,
draft messages, log outcomes. It never sends anything. Guide:
[sales-mcp.md](sales-mcp.md); decision: ADR-0006.

## Not built (by design)

AI lead scoring (leave room for a `lead_scores` table — do not
create it) · automated lead research · sending email/WhatsApp from the app ·
reporting beyond the counter strip · closing a demo room when a lead is
parked or lost.

Deferred by the sales workspace redesign
([designs/sales-workspace-redesign.md](designs/sales-workspace-redesign.md)):
WhatsApp message templates per bucket · kanban board view · sprint/track
metrics widget (the sprint mandates a read-only SQL query) · admin Playwright
fixture and an end-to-end Today flow test · `occurred_at` index and `pg_trgm`
search index · the users export's size risk at its 50,000-row cap.
