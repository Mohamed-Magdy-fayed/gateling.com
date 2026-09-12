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
  lib/calling-window.ts  ← Cairo business-hours advice
  server/service.ts      ← ALL business logic (server-only)
  server/recompute.ts    ← shared with the seed CLI (NOT server-only — see below)
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

Enforced, not merely displayed: `doNotContact` and `parked` leads are filtered
out of **every** bucket; `blocked_no_number` cannot enter the new queue; the cap
is applied inside the rules module, not the UI.

The `followUpCount >= 2` cutoff is a **safety limit, not a preference** —
chasing past two unanswered WhatsApp messages risks a ban on the business
number.

## Derived values

Never hand-maintained. Cached on `leads` for query performance and recomputed
from `lead_activities` by `recomputeLeadDerived()` after every append:

- `lastContactedAt` — latest contact-type activity. **`demo_agreed` is a contact
  type**; without it the Rescue bucket cannot see leads that agreed to a demo.
- `followUpCount` — `whatsapp_sent` + `call` since the last inbound reply.
- `nextActionAt` — earliest unfulfilled promise. Discharged by stamping
  `nextActionDoneAt`, never by editing history.

`lead_activities` is **append-only**. The service layer exposes no update or
delete for it, and must not.

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

## Testing

```bash
npm run test:unit                       # Vitest — rules + CSV mapping (43 tests)
npx playwright test e2e/sales-access.spec.ts   # access control + no public leakage
```

Vitest was added for this module; Playwright still owns `npm test`.

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

## Not built (by design)

MCP/agent API · AI lead scoring (leave room for a `lead_scores` table — do not
create it) · automated lead research · sending email/WhatsApp from the app ·
reporting beyond the counter strip · closing a demo room when a lead is
parked or lost.
