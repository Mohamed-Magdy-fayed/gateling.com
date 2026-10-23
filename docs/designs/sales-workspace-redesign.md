<!-- /autoplan restore point: "G:\\apps\\gateling.com\\.gstack\\tmp\\autoplan\\feat-anti-bot-signup-leads-autoplan-restore-20261023-002552.md" -->
# Sales workspace redesign: Today's work + Pipeline table

Status: APPROVED (autoplan gate rev 1, 2026-10-23: every recommendation taken except UC1, where the owner kept both parts now)
Owner: Mohamed
Related: `docs/sales-pipeline.md`, `src/features/system/sales/**`

## Implementation plan

### Problem

1. **Pipeline (`/sales/leads`)** is a hand-rolled `<Table>` with four ad-hoc filter
   inputs, prev/next buttons and no sorting UI, column visibility, URL state,
   selection, bulk actions, export or row actions. Every other admin list
   (users, leads, bookings, blog posts) uses the shared `@/features/core/data-table`
   kit (`DataTable`, `useDataTable` server mode, `useTableUrlState`,
   `DataTableToolbar`, faceted/date/number filters, `DataTableViewOptions`,
   `DataTableExportButton`, `DataTableActionBar`, pinned actions column).
   Operators lose filters on refresh and cannot answer "who did I last talk to
   in Maadi, tier A, more than 7 days ago" without scrolling.
2. **Today's work (`/sales/today`)** stacks: two calling-window alerts, a
   pipeline counter card (whole-pipeline stats, not today's work), then up to
   five bucket cards where every row has equal weight and three buttons
   (WhatsApp, Park, Quick log). Quick log is a 7-field popover (type, channel,
   when, outcome, notes, next action, new status). Nothing says "do this lead
   next, and here is the one action to take". After a save the whole list
   reshuffles because every query is invalidated, so the operator loses their
   place. There is no sense of progress ("4 of 14 done").

### Goals

- G1. Pipeline uses the shared data-table kit with feature parity to the users
  table: server-side sorting, column filters, global search, URL state,
  pagination with page size, column visibility, pinned row actions, row
  selection with bulk actions, CSV export.
- G2. Today's work leads the operator through the day: one obvious next lead,
  one obvious primary action per lead, outcome logging in one or two taps,
  automatic advance to the next lead, visible progress.
- G3. No change to the bucket rules (`lib/today-rules.ts`), the append-only
  activity log, or derived-column ownership (`recomputeLeadDerived`).

### Non-goals

- Changing bucket thresholds or adding buckets.
- Multi-operator assignment / owner routing (single operator today).
- CSV import into the pipeline (seed CLI already covers it).
- Undo of a logged activity (activities are append-only by invariant).

### Part A: Pipeline table (`/sales/leads`)

A1. **Server contract** (`server/schemas.ts`, new `server/filters.ts`):
- Replace `listPipelineSchema` ad-hoc fields with the shared grid shape
  `{ page, perPage, sorting, columnFilters, globalFilter }`, same as
  `users/server/schemas.ts`.
- New `server/filters.ts` modelled on `users/server/filters.ts`:
  `buildPipelineWhere(input)` and `pipelineSortExpr(sorting)` with a whitelist.
  - Filters: `pipelineStatus` (multi, `inArray`), `tier` (multi, plus
    "untiered" → `isNull`), `whatsappStatus` (multi), `city` (text, ilike),
    `followUpCount` (number range), `lastContactedAt` / `nextActionAt` /
    `createdAt` (date range), `doNotContact` (yes/no).
  - Global search: name, nameAr, phone, phoneSecondary, city, area,
    whatsappProfileName. Like-fragments sanitized (`%`, `_`, `\`) — the current
    `listPipeline` does not sanitize.
  - Sort whitelist: name, tier, pipelineStatus, city, followUpCount,
    socialFollowers, lastContactedAt, nextActionAt, createdAt; default
    `createdAt desc`. Nulls last for the timestamp and follower sorts.
  - Always scoped to `kind = 'prospect'`.
- `sales.list` keeps its name; new `sales.exportRows` (same filters, capped at
  `EXPORT_ROW_LIMIT`) for the CSV button. Admin-only like every sales procedure.
- New `sales.bulkPark` and `sales.bulkSetStatus` mutations: each lead goes
  through `service.logActivity` (`status_change` activity) inside one
  transaction, so bulk changes keep the append-only timeline and recompute
  derived columns. Input capped at 100 ids.

A2. **Client** (`admin/leads-table-page.tsx` rewritten, new
`admin/components/pipeline-table-columns.tsx`, `pipeline-grid-filters.tsx`,
`pipeline-row-actions.tsx`, `pipeline-bulk-actions.tsx`):
- `useTableUrlState({ page: 1, perPage: 20 })` + `useDataTable({ mode: "server" })`,
  same wiring as `customers-table-page.tsx`.
- Columns: select; name (+ nameAr, link to detail); location (city · area);
  phone (LTR island, `tel:` link); WhatsApp status badge; tier; pipeline status
  badge (color by stage group); follow-ups; last contacted (relative +
  tooltip absolute); next action (red when overdue); followers (hidden by
  default); created (hidden by default); actions (pinned end).
- Toolbar: global search, faceted filters (status, tier, WhatsApp), date-range
  filters (last contacted, next action), view options, export, "New lead".
- Quick views above the toolbar as chips that set URL filters: All · Needs
  follow-up (`awaiting_reply`) · Demos (`demo_agreed|demo_scheduled|demo_done`)
  · Won · Parked/Lost. Pure presets over existing filters, no new server code.
- Row actions menu: Open, Quick log, WhatsApp, Edit, Park.
- Bulk action bar: Park, Change status (parked or lost only).
- Pipeline counters (`PipelineCounters`) move here from Today, as a compact
  stat strip above the table; clicking a status badge applies that filter.

### Part B: Today's work (`/sales/today`)

B1. **Layout, top to bottom**
1. Header: title + **progress** "Done today: N · Left: M" with a progress bar.
   Calling-window advice becomes one compact inline `Alert` (only when
   outside hours).
2. **Up next** card: the first row of the highest-priority non-empty bucket.
   Large name, location, phone (big `tel:` button, LTR), WhatsApp button,
   reason sentence, opening angle, days since contact, and the bucket's
   **recommended action** as the primary button. Outcome buttons directly
   below (see B2). A "Skip for now" moves it to the end of the session queue
   (client-only, not persisted).
3. **Queue**: remaining rows grouped by bucket in priority order, compact
   one-line rows (name, reason, single primary action, overflow menu).
   Clicking a row promotes it to Up next. Buckets show count + hint; capped
   new-queue shows "10 of 37".
4. Empty state: "All done for today" with links to Pipeline and tomorrow's
   promised follow-ups count.

B2. **Outcome-first logging** (new `lib/outcomes.ts`, pure + unit tested):
- Each bucket maps to a recommended action and a short outcome set. Each
  outcome maps to `{ type, channel, pipelineStatus, needsTime }`:
  - Call outcomes: Interested → demo_agreed · Book demo (needs time) →
    demo_scheduled · Call back (needs time) → callback_scheduled · No answer →
    awaiting_reply · Not interested → lost · Wrong number → blocked_no_number.
  - WhatsApp outcomes: Sent → awaiting_reply · Replied → contacted.
  - Auto-park bucket: Park (primary) · They replied · Answered a call.
- Outcomes needing a time open an inline date-time picker with presets
  (Today 5pm, Tomorrow 11am, +2 days) and then save.
- "More details" opens the existing full `QuickLogPopover` (kept, unchanged
  contract) for notes/outcome text/backdating.
- Save → optimistic removal from the session queue, toast, advance Up next to
  the following lead, then refetch `sales.today` only
  (targeted `queryKey`, not `invalidateQueries()` with no key).

B3. **Server additions** (`service.ts`):
- `getTodayWork` also returns `doneToday` (count of distinct prospect leads
  with a contact activity `occurredAt` since Cairo-local midnight, using
  `getSalesSettings().timeZone`) so progress survives refresh.

### Cross-cutting

- i18n: every new string in `sales-en.ts` and `sales-ar.ts` in the same change.
- RTL: logical properties only; chevrons/arrows flip; phones, dates in
  `dir="ltr"` islands; progress bar fills from inline-start.
- Accessibility: Up next actions are real buttons with visible focus; outcome
  buttons have text labels (no icon-only); keyboard shortcuts are in scope (see accepted requirements).
- Mobile: Up next card is the first thing under the header; primary call
  button full-width under 640px.

### Tests

- Unit: `lib/outcomes.test.ts` (every bucket → action, every outcome →
  activity payload, needsTime rules); `server/filters.test.ts`
  (`buildPipelineWhere` / `pipelineSortExpr` per filter id, sanitization,
  unknown sort id falls back).
- Existing `lib/today-rules.test.ts` must stay green unchanged.
- E2E: extend `e2e/sales-access.spec.ts` only for access (no admin fixture);
  UX pass via human checklist per `standards/design.md`.

### Files

- Modify: `server/schemas.ts`, `server/service.ts`, `server/router.ts`,
  `admin/leads-table-page.tsx`, `admin/today-page.tsx`,
  `admin/components/today-lead-row.tsx`, `translations/sales-en.ts`,
  `translations/sales-ar.ts`, `docs/sales-pipeline.md`.
- New: `server/filters.ts`, `server/filters.test.ts`, `lib/outcomes.ts`,
  `lib/outcomes.test.ts`, `admin/components/pipeline-table-columns.tsx`,
  `pipeline-grid-filters.tsx`, `pipeline-row-actions.tsx`,
  `pipeline-bulk-actions.tsx`, `today-up-next-card.tsx`,
  `today-queue.tsx`, `outcome-buttons.tsx`.

### Gates

`/ui-scan --plan` before UI work, `/ui-scan` on every touched UI file,
`typecheck && build`, unit tests green, lint no worse than baseline.


<!-- autoplan-accepted:ceo -->
- Pipeline default sort stays `createdAt desc` (newest first) when no sort is in the URL: the sell-first sprint's distributor first-touch step opens new batches "from the top of `/sales/leads`" (sprint design, commit c956ef0, line 102). Verify: `server/filters.test.ts` asserts `pipelineSortExpr([])` orders by `createdAt desc`.
- Pipeline gains a `businessType` column (visible by default) and a text/faceted filter on it, server-side via `buildPipelineWhere`, so the distributor track (`businessType = "distributor"`) can be isolated. Verify: `server/filters.test.ts` case for `businessType`.
- Today's work gains keyboard shortcuts scoped to the Up next card: `C` call (tel link), `W` WhatsApp, `1`-`9` the visible outcome buttons in order, `S` skip, `?` shows the shortcut list. Disabled while focus is in an input, textarea, select or open popover/dialog. Shortcut hints are visible on the buttons (kbd) and announced via `aria-keyshortcuts`. Verify: unit test of the key → action mapper in `lib/outcomes.test.ts` (or a sibling `today-shortcuts.test.ts`) including the "focus in input → ignored" case; human checklist item.
- The "All done for today" empty state shows how many promised follow-ups are due tomorrow (count of prospect leads with `nextActionAt` within the next Cairo-local day), returned by `getTodayWork` as `dueTomorrow`. Verify: service-level unit test or `today-rules`-style pure helper test for the day-boundary computation.
- No change to the logged-activity contract: every outcome button and bulk action goes through `service.logActivity` (or `parkLead`), so the sprint's day-14 read-only query over `lead_activities` keeps counting the same rows. Verify: `lib/outcomes.test.ts` asserts each outcome produces a payload accepted by `logActivityInputSchema`.
- NOT in scope (deferred, recorded in `docs/sales-pipeline.md` "Not built (by design)" in the same change): WhatsApp message templates per bucket (deferred by the sell-first design, c956ef0 line 11); kanban board view (L effort, not a sprint pain); sprint/track metrics widget (sprint mandates a read-only SQL query). Skipped: persisted saved views (URL quick-view chips cover it); "Export selected" bulk action (export of the filtered set covers it).
- Part A and Part B are independently shippable. Files and tests are listed per part: Part B = `lib/outcomes.ts`(+test), `lib/today-shortcuts.ts`(+test), `lib/day-window.ts`(+test), `lib/today-session.ts`(+test), `service.ts` (`getTodayWork` additions + `logActivity` executor refactor), `today-page.tsx`, `today-up-next-card.tsx`, `today-queue.tsx`, `outcome-buttons.tsx`, `today-lead-row.tsx`, translations. Part A = `server/schemas.ts`, `server/filters.ts`(+test), `router.ts`, `leads-table-page.tsx`, `pipeline-*.tsx`, `core/data-table/lib/csv.ts`(+test), translations. Part A ships now, not after the sprint's day-14 gate (UC1b, the owner's call at the final gate, 2026-10-23).
- Outcome table (all saves call the existing `sales.logActivity` tRPC mutation, so `demo_scheduled` still triggers the Inngest Meetings provisioning in the router): call set — Interested → type `demo_agreed`, channel phone, status `demo_agreed`; Book demo → `demo_scheduled`, phone, `demo_scheduled`, needs demo time; Call back → `call`, phone, `callback_scheduled`, needs `nextActionAt`; No answer → `no_answer`, phone, `awaiting_reply`; Not interested → `call`, phone, `lost`; Wrong number → `call_unclear`, phone, `blocked_no_number`. WhatsApp set — Sent → `whatsapp_sent`, whatsapp, `awaiting_reply`; Replied → `whatsapp_reply`, whatsapp, `contacted`. Auto-park set — Park (primary) → `sales.park`; They replied → `whatsapp_reply`, whatsapp, `contacted`; Answered a call → `call`, phone, `contacted`. The auto-park bucket never offers another outbound message: the follow-up limit of 2 (`today-rules.ts:92`) exists to avoid a WhatsApp ban. Verify: `lib/outcomes.test.ts` covers every outcome and asserts no auto-park outcome is `whatsapp_sent` or `no_answer`.
- Recommended primary action per bucket: rescue → Call ("book the demo"); overdue → Call ("keep the promise"); followUp → WhatsApp when `whatsappStatus = confirmed`, else Call; newQueue → Call; autoPark → Park. A lead with no phone gets "Open lead" as primary and Call/WhatsApp are disabled with a visible reason. Verify: `lib/outcomes.test.ts` table test over bucket × whatsappStatus × hasPhone.
- Failed save: the optimistic removal is rolled back (lead returns to its previous position and stays Up next if it was), an error toast shows `sales.logFailed`, and nothing advances. Double-submit is blocked while a save is pending. Verify: pure session reducer in `lib/today-session.ts` tested in `lib/today-session.test.ts`; human checklist (save while offline).
- Skip: skipped lead ids live in client state (sessionStorage keyed by Cairo date, wrapped in try/catch, works without storage) and are re-applied after every refetch, moving those leads to the end of the queue. Verify: `lib/today-session.test.ts`.
- Progress: `doneToday` = distinct prospect leads with any activity whose `occurredAt` is on or after Cairo-local midnight (includes parks and status changes); "Left" = `totalActionable` from the latest `sales.today`; bar = done / (done + left), 0 when both are 0. Day boundaries come from a pure `lib/day-window.ts` (`startOfLocalDay`, `startOfNextLocalDay` given `now` + timeZone), which also defines `dueTomorrow` (leads with `nextActionAt` in [next local midnight, the one after)). Verify: `lib/day-window.test.ts` including a UTC-late-evening case that is already "tomorrow" in Cairo.
- Today refetches only `sales.today` after a save (counters moved to Pipeline); Pipeline mutations invalidate `sales.list` and `sales.counters` by `queryKey`, never a bare `invalidateQueries()`.
- Bulk "Change status" offers only `parked` and `lost`. Terminal statuses (`lost`, `won`, `parked`, `blocked_no_number`) set via `logActivity` also stamp `nextActionDoneAt` on open promises, so a lost lead cannot reappear in Overdue. Verify: service-level test that a lost lead with an open promise has `nextActionAt = null` after the log.
- `service.logActivity` is refactored to take an executor (the `Executor` type in `server/recompute.ts`) so bulk mutations run every lead's log inside one transaction; `bulkPark`/`bulkSetStatus` cap input at 100 ids and are droppable if Part A ships trimmed. Verify: typecheck + a bulk test.
- CSV exports neutralise formula injection: `core/data-table/lib/csv.ts` `escapeCell` prefixes `'` to cells starting with `=`, `+`, `-`, `@`, tab or CR (fixes every table, not just sales). Verify: `csv.test.ts`.
- Filter/sort details: `businessType` is a text (ilike, sanitized) filter; `doNotContact` is a faceted yes/no filter in the toolbar; `lastContactedAt`, `followUpCount`, `nextActionAt` filter and sort on the `LeadsTable` cache columns only (no joins to activities). Quick-view chips and counter-badge click are URL filter presets (no server code) and count as G1 parity.
- Shortcut handling lives in a pure `lib/today-shortcuts.ts` key → action mapper (`C`, `W`, `1`-`9`, `S`, `?`; ignored when the event target is an input/textarea/select/contenteditable or a dialog/popover is open). Verify: `lib/today-shortcuts.test.ts`.
- Shortcut mapper is layout-independent and gated: it matches `event.code` (`KeyC`, `KeyW`, `KeyS`, `Digit1`-`Digit9`, `Shift`+`Slash`), ignores Ctrl/Alt/Meta combinations, and receives the card's currently enabled actions; a key whose action is hidden or disabled does nothing, and digit keys beyond the visible outcome count do nothing. Verify: `lib/today-shortcuts.test.ts` with an Arabic-layout event (`key: "ؤ"`, `code: "KeyC"`) and a disabled-action case.
- Up next action gating: in the auto-park bucket the Call and WhatsApp buttons (and `C`/`W`) are hidden; for a lead with no usable phone they are disabled with a reason; WhatsApp is enabled whenever `toWhatsAppUrl(phone)` returns a link, with an "unconfirmed" hint when `whatsappStatus !== "confirmed"`. Verify: `lib/outcomes.test.ts` (enabled-actions helper).
- Daily target is stable: `getTodayWork` also returns `newTouchedToday` (prospect leads whose first contact activity `occurredAt` is today, Cairo-local). Progress "Left" counts newQueue rows only up to `max(0, newQueueCap - newTouchedToday)`; newQueue rows beyond that render in the queue under "Extra (daily goal met)" and do not move the bar. Bucket rules in `today-rules.ts` stay unchanged (G3). Verify: `lib/today-session.test.ts` simulates working 10 new leads with a refilling newQueue and asserts the bar reaches 100% and stays there.
- Time presets never write the past: presets already past in Cairo time are hidden, and every outcome that needs a time rejects `nextActionAt <= now` on the client with an inline error. The time an outcome needs (Book demo, Call back) is always `nextActionAt`, the field `logActivityInputSchema` and the router's Inngest trigger require. Verify: `lib/day-window.test.ts` (preset list at 16:59 vs 17:01 Cairo) and `lib/outcomes.test.ts`.
- Pipeline respects `doNotContact`: for those rows the WhatsApp and Quick log row actions are disabled with a "Do not contact" reason, and the phone renders as plain text instead of a `tel:` link; a "Do not contact" badge shows in the name cell. Verify: human checklist item.
- Counter placement is per part: Part A moves `PipelineCounters` to Pipeline; until Part A ships, Part B keeps `PipelineCounters` on Today, collapsed below the queue. `docs/sales-pipeline.md` is updated by whichever part ships first and again by the second.
- `logActivity` transaction handling: export `Executor` from `server/recompute.ts`; split into `logActivityInTx(tx, input, actorId)` (no transaction of its own) and `logActivity(db, ...)` which wraps it in `db.transaction`; `parkLead` gets the same split; bulk mutations call the `InTx` variants inside one `db.transaction`. Promise discharge becomes explicit: stamp `nextActionDoneAt` when `isContactActivity(type)` OR `pipelineStatus` is terminal (`lost`, `won`, `parked`, `blocked_no_number`). Verify: service test for both discharge branches and for a status_change to a non-terminal status (no discharge).
- CSV guard is phone-safe and round-trips: `escapeCell` prefixes `'` only to strings starting with `=`, `@`, tab or CR, or starting with `+`/`-` when the value is not phone/number-shaped (`/^[+-]?[\d\s().-]+$/`); `parseCsvToObjects` strips a leading `'` only when it is followed by one of `= + - @`. `EXPORT_ROW_LIMIT` moves from `users/server/filters.ts` to `core/data-table` and both features import it there. Verify: `csv.test.ts` (`+201001234567` unchanged, `=HYPERLINK(...)` prefixed, round trip restores the original).
- Supersedes earlier prose where they differ: B1.2's skip is kept in sessionStorage for the Cairo day (not "not persisted"); B3's `doneToday` counts any activity (not only contact activities); the Files list additionally includes `lib/today-shortcuts.ts`, `lib/today-session.ts`, `lib/day-window.ts` (each with a test), and modifies `server/recompute.ts`, `core/data-table/lib/csv.ts` (+test) and `users/server/filters.ts` (EXPORT_ROW_LIMIT import).
- G3 exception 1 (taste, surfaced at the gate): an answered `call` is a conversation, so in `lib/derived.ts` `computeDerived` it resets `followUpCount` to 0 the same way `whatsapp_reply` does and is no longer in `FOLLOW_UP_ACTIVITY_TYPES` (outbound attempts become `whatsapp_sent`, `no_answer`, `call_unclear`). Existing leads are re-derived once with the existing `recomputeLeadDerived` over every prospect (a data step: `.env` points at production Neon, so it runs only after explicit confirmation). Verify: `lib/derived.test.ts` cases (answered call resets; no_answer counts; two no_answers reach the limit) and `today-rules.test.ts` stays green.
- G3 exception 2 (taste, surfaced at the gate): `isSuppressed` in `today-rules.ts` also suppresses `lost`, `won` and `blocked_no_number` (in addition to `parked` and `doNotContact`), so terminal leads never appear in any Today bucket, including Auto-park. Verify: new `today-rules.test.ts` cases, one per terminal status with 2+ follow-ups.
- `getTodayWork` reads `getSalesSettings()` itself and returns `{ timeZone, newQueueCap, now }` alongside `doneToday`, `dueTomorrow` and `newTouchedToday`; the effective cap is the router input override, else the settings value, else the default 10. The client uses the returned `timeZone`/`now` for presets and the sessionStorage date key. Verify: service test for the cap precedence.
- Progress semantics: a lead logged today that becomes due again the same day (e.g. Call back at 17:00) counts in both Done and Left, so the bar can dip; this is accepted and documented. "All done for today" shows when Left = 0; any "Extra (daily goal met)" newQueue rows stay listed below it as optional.
- Outcome set shown on Up next: the set matching the bucket's primary action (call set when primary is Call, WhatsApp set when primary is WhatsApp, auto-park set in Auto-park). Pressing the other channel's button (opening `tel:` or the WhatsApp link) switches the visible set to that channel's outcomes. Digit keys map to the visible set in display order. Verify: `lib/outcomes.test.ts` (`outcomesFor(bucket, lastChannel)`).
- Shipping order dependency: `server/service.ts` and `server/recompute.ts` belong to both parts. Part A also rewrites `listPipeline` and adds `exportRows` in `service.ts`. Whichever part ships first carries the `logActivityInTx`/`Executor` refactor, the terminal-status discharge and the `derived.ts` change. Part A's list also includes `users/server/filters.ts` and `users/server/queries.ts` for the `EXPORT_ROW_LIMIT` move.
- `EXPORT_ROW_LIMIT` moves to a plain module `src/features/core/data-table/lib/limits.ts`, imported by path (never through the client `index.ts` barrel) from server code.
- Discharge order: in `logActivityInTx` the open-promise stamp (contact activity OR terminal status) runs before the new activity is inserted, as in the current contact path (`service.ts:72-83`), so a terminal log that carries its own `nextActionAt` keeps that new promise open.
- Undo window for terminal outcomes: "Not interested" (lost), "Wrong number" (blocked_no_number) and "Park" hold the write client-side for 5 seconds behind a toast with an Undo button; the lead leaves Up next immediately, Undo restores it and nothing is written; after 5 s (or on page hide via `visibilitychange`) the write is sent. Non-terminal outcomes save immediately. Reopening an already-written terminal lead stays possible from the lead detail page's Quick log (status → contacted). Verify: `lib/today-session.test.ts` (pending → undo → no write; pending → timeout → write; pending → page hide → write).
- Call button works without a softphone: next to the `tel:` button the Up next card shows the number large in an LTR island with a Copy button; on desktop widths the Copy button is the secondary action. Verify: human checklist item (desktop and phone).
- Progress shows "Conversations today" (distinct leads with an answered `call`, `whatsapp_reply`, `demo_agreed` or `demo_scheduled` today) next to the Done/Left bar, so parks and status changes cannot fill the headline alone. Returned by `getTodayWork` as `conversationsToday`. Verify: service test.
- G3 exceptions ship dated: the change date is written in `docs/sales-pipeline.md` (and noted for the sell-first day-14 read) so the read can split before/after; the one-time production recompute runs only after explicit user confirmation and logs the number of leads whose derived values changed.
- Baseline before shipping Part B: one read-only query over `lead_activities` records leads touched per day, median hours between logs and demos booked per week for the sprint so far, written into `docs/sales-pipeline.md`; re-read two weeks after ship. Read-only against production, run only after the user confirms.
- Spec consolidation is the first implementation step: fold every accepted requirement into the Part A / Part B / Cross-cutting / Tests / Files sections and delete superseded prose, so the implementer reads one spec.
- "Why build, not buy" line added to `docs/sales-pipeline.md`: the pipeline already owns bucket rules, the WhatsApp follow-up safety limit, Meetings demo provisioning and bilingual RTL; an external CRM would duplicate those.
- The CSV formula-injection guard and the `EXPORT_ROW_LIMIT` move ship as their own small PR (they touch every table), not inside the sales change.
- `logActivityInTx` throws `NOT_FOUND` when the lead id is not a prospect (today the status update silently matches 0 rows); the client shows a "Lead not found" toast and drops it from the session. The Pipeline export shows "First 50,000 rows exported" when the cap is hit. Verify: service test (non-prospect id → NOT_FOUND); filters/export test at the cap.
- Audit log lines: `sales.export` (userId, row count, filters) and `sales.bulk` (userId, action, count, target status) via the router's existing `console.info` pattern. Verify: code review.
- Stale-refetch guard: before the optimistic removal, cancel in-flight `sales.today` queries; the session keeps a `doneIds` set applied over every refetch until the server stops returning those ids. Verify: `lib/today-session.test.ts` releases a stale response after a write and asserts the lead stays hidden.
- When every remaining lead has been skipped, the card shows an "All remaining leads skipped" note with a "Start over" button that clears the skip list. Verify: `lib/today-session.test.ts`.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- Up next card visual order (top to bottom): (1) identity row: name (title size), Arabic name, location, days since contact; (2) why now: reason sentence, then opening angle in `muted-foreground`; (3) contact zone: the phone number large in an LTR island (dominant element) with the bucket's recommended action as the ONLY `variant="default"` button on the card, Copy and WhatsApp as `outline`; (4) channel switch + outcome row; (5) tertiary text links: Skip, More details. Everything else is `outline` or `ghost`.
- Outcomes are always visible; before the primary action fires they render muted under the label "After you call: how did it go?" (WhatsApp: "After you message: what happened?"); once the primary action fires, the row is promoted to normal emphasis and focus moves to the first outcome. The triggering action and channel are remembered per lead for the session. Verify: `lib/today-session.test.ts`.
- Up next is pinned: the session stores the Up next lead id and keeps it until the operator saves, skips or promotes another row; a refetch that surfaces a higher-priority lead puts it in the queue with a "New" marker, never replacing Up next. Verify: `lib/today-session.test.ts` (refetch with a new rescue lead keeps the pinned lead).
- Progress header: headline is the bar plus "N of M done" (EN) / Arabic equivalent; "Conversations today: K" is a secondary stat chip; a dip is not animated. Copy keys in both `sales-en.ts` and `sales-ar.ts`.
- Pipeline chips: the counter strip and quick-view chips merge into one chip row where each chip shows its count; clicking a chip replaces the status filter and keeps other filters; a chip is active only when the status filter equals its preset exactly. (Part A.)
- States table (both pages): Today — loading: skeleton matching Up next card + 4 queue rows; error: inline `Alert` with translated message + Retry; background refetch: no blanking, a small inline spinner in the header only; empty precedence: (a) no prospects at all → "No leads yet" + link to Pipeline "New lead"; (b) Left = 0 → "All done for today" with recap (conversations, demos booked today, due tomorrow) and any Extra rows listed below as optional; (c) all remaining skipped → note + "Start over". Pipeline — loading: kit skeleton; empty with filters → "No leads match these filters" + "Clear filters"; empty with no prospects → "No leads yet" + "New lead"; export pending → button pending state; export failure → error toast; cap → inline notice under the toolbar. Verify: human checklist rows for each state.
- Bulk terminal actions confirm first: an `AlertDialog` shows the count and target status ("Mark 12 leads as Lost?"); the action bar shows a pending state; select-all selects the current page only, capped at 100 with an inline notice; success clears selection and toasts the count; failure toasts "Nothing changed" (one transaction).
- Undo window details: pending writes also flush on route change and component unmount (not only `visibilitychange`); toasts stack and each Undo restores its own lead; progress updates optimistically and Undo reverses it. Verify: `lib/today-session.test.ts`.
- Time picker: expands below the outcome row in place (the outcome row stays visible but disabled); digit shortcuts are suspended while it is open; when every preset is past, only the custom datetime field shows with a note; times are entered and shown in Cairo time with a "Cairo time" label when the device timezone differs; a Book demo whose Meetings room fails to provision shows on the lead's existing demo card as "Room pending" (current behaviour).
- Channel switch: a two-option segmented control (Call / WhatsApp) above the outcome row reflects the current outcome set and can be switched manually; pressing a channel button also sets it. Hidden in Auto-park.
- Promoting a queue row puts the previous Up next lead back in its original slot (promoting is not skipping). Verify: `lib/today-session.test.ts`.
- `getTodayWork` also returns `demosBookedToday` (distinct leads with a `demo_scheduled` activity today) for the All done recap.
- Stage-group badge tokens: open (`new`, `blocked_no_number`) → `bg-muted text-muted-foreground`; in conversation (`contacted`, `awaiting_reply`, `callback_scheduled`) → `bg-primary/10 text-primary`; demo (`demo_agreed`, `demo_scheduled`, `demo_done`) → warning token (`bg-warning/10 text-warning`, amber fallback per global rules); won → success (emerald per global rules); closed (`lost`, `parked`) → `outline` muted. No raw palette classes.
- Overdue next-action shows an icon plus the text "Overdue" (sr-only on narrow widths) in `text-destructive`, never colour alone.
- Pipeline below 768px: the table scrolls horizontally inside its container with the name column pinned to inline-start (kit pinning); default visible columns unchanged.
- Disabled reasons render as inline `muted-foreground` text under the button group; disabled controls use `aria-disabled` + `aria-describedby` so the reason is reachable by keyboard and screen readers.
- Kbd hints and the `?` shortcut list are hidden under `(pointer: coarse)`.
- `C` means "start call": on a coarse pointer it opens `tel:`; on a fine pointer it copies the number (and marks the call started, promoting the outcome row). Verify: `lib/today-shortcuts.test.ts` with both pointer modes.
- Outcome buttons: one row on `sm`+, two-column grid below `sm`; terminal outcomes (Not interested, Wrong number) are grouped last and use the destructive outline style.
- Advancing to the next lead uses a ≤200 ms crossfade (no directional slide), disabled under `prefers-reduced-motion`.
- The queue renders as a plain list inside one surface (rows separated by dividers), not a stack of cards; only Up next is a raised surface.
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- Spec consolidation happens before implementation handoff (not during it): one spec with a per-PR table (files, tests, verify command) and superseded prose deleted. Ship order: PR0 = CSV guard + `limits.ts` (shared kit); PR1 = `Executor` export, `logActivityInTx`/`parkLeadInTx`, terminal discharge, `derived.ts` call reset, terminal suppression, recompute script; PR2 = Part B (Today); PR3 = Part A (Pipeline, ships now per UC1b). Each PR's gate: `npx vitest run src/features/system/sales` (plus `src/features/core/data-table` for PR0), `npm run typecheck`, `npm run build`, and `npx playwright test e2e/sales-access.spec.ts` on port 3001 (port 3000 is often held by the Meetings dev server).
- Durable deferred writes: pending terminal outcomes are mirrored in sessionStorage (try/catch) as `{ clientId, leadId, payload, createdAt }`. In-app navigation does not flush early: the mutation runs in the shared QueryClient and its toast survives route changes. On `pagehide` the write is sent with `fetch(..., { keepalive: true })`. On the next Today load, any mirrored entry still present is reconciled: the client asks `sales.byId` whether an activity of that type at or after `createdAt` exists; if yes the entry is dropped, if no it is re-sent once, and a toast "1 change could not be saved, retry" offers a retry when that fails. Verify: `lib/today-session.test.ts` cases for flush failure, reconcile-found and reconcile-missing.
- Guarded data scripts: `npm run sales:recompute -- --dry-run|--yes` (new CLI alongside the existing seed CLI, using `recomputeLeadDerived`) prints the redacted target DB host first, refuses without `--yes`, `--dry-run` reports how many leads would change, runs in transactional batches, is idempotent, exits non-zero with lead id + cause on stderr for failures and logs the changed count. The baseline is a checked-in read-only `docs/queries/sales-baseline.sql` plus the exact command in `docs/sales-pipeline.md`. Verify: dry-run against a local/branch DB; unit test for the batch planner.
- Bulk API: one mutation `sales.bulkSetStatus({ ids, status })` with `status: z.enum(["parked","lost"])` and `ids` max `BULK_ACTION_LIMIT` (100); `bulkPark` is dropped. Named constants: `BULK_ACTION_LIMIT` and `EXPORT_ROW_LIMIT` in `core/data-table/lib/limits.ts`; `UNDO_WINDOW_MS = 5000`, `TIME_PRESETS` and the crossfade duration in `sales/lib/today-session.ts` / `lib/day-window.ts`.
- `sales.exportRows` returns `{ rows, truncated, limit }` (fetches `limit + 1` to detect truncation); a truncated CSV is named `sales-pipeline-truncated-<limit>.csv`.
- `getTodayWork` returns a named `TodayWorkSummary` type (exported from `server/schemas.ts`) carrying buckets plus `doneToday`, `dueTomorrow`, `newTouchedToday`, `conversationsToday`, `demosBookedToday`, `timeZone`, `newQueueCap`, `now`.
- Agent-ready errors: service functions throw typed domain errors (`SalesError` with `appCode`, e.g. `SALES_LEAD_NOT_PROSPECT`, `SALES_BULK_LIMIT`, `SALES_DEMO_TIME_REQUIRED`) carrying the lead id; the router maps them to `TRPCError` codes with a message naming the id and the `appCode` in `cause`. Unexpected failures in bulk/export log `{ correlationId, action, count, cause }` server-side and show the correlation id in the toast. The Today save toast distinguishes network (Retry), validation (point at the field) and not-found (drop from session). Audit lines log filter ids, never the global-search text. `docs/sales-pipeline.md` gets an "Errors" section listing each `appCode` and the client behaviour. Verify: service tests assert `appCode` per failure.
- Docs: `docs/sales-pipeline.md` gains the bucket → primary action → outcome-set matrix, the outcome → type/channel/status table and the shortcut table (key/code, action, when disabled); `lib/outcomes.ts` and the `?` overlay read from the same mapper so docs, tests and UI cannot drift. Bulk acting on a whole filtered set is listed under "Not built (by design)".
- Shortcut opt-out: the `?` panel has a "Keyboard shortcuts on/off" toggle stored per viewer in localStorage (try/catch; default on).
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- Stale-refetch guard is time-scoped, not id-scoped (replaces the earlier `doneIds` rule): after a write resolves, in-flight `sales.today` queries are cancelled and the session hides a written lead only in responses whose fetch started before the write resolved; the first post-write response is authoritative, so a lead legitimately due again the same day (Call back at 17:00) reappears. Verify: `lib/today-session.test.ts` (stale pre-write response stays hidden; post-write response with the same lead due again shows it).
- Undo is compensating, not deferred (replaces the sessionStorage mirror / keepalive / reconcile design and the route-change flush rules): terminal outcomes write immediately; Undo within `UNDO_WINDOW_MS` logs a `status_change` back to the previous status and, when the outcome discharged open promises, carries the earliest discharged `nextActionAt` so the promise is re-created; the lead returns to the session at its slot. The timeline shows both rows honestly. Verify: service test (lost then undo restores status and nextActionAt) + `lib/today-session.test.ts`.
- Prospect check before any write: `logActivityInTx` starts with `select id, pipeline_status, next_action_at from leads where id = $1 and kind = 'prospect' for update`; missing → `SalesError(SALES_LEAD_NOT_PROSPECT)`. The row lock serialises concurrent logs on one lead. Verify: service test with a customer-kind lead id and no `pipelineStatus` in the payload.
- Server-side do-not-contact guard: `logActivityInTx` rejects outbound types (`call`, `no_answer`, `call_unclear`, `whatsapp_sent`) for `doNotContact` leads with `SalesError(SALES_DO_NOT_CONTACT)`. Verify: service test.
- Sales export cap is sized to the response limit: `SALES_EXPORT_ROW_LIMIT = 5000` in `core/data-table/lib/limits.ts` (users keep 50,000; their latent size risk goes to TODOs). Verify: export test at the cap with realistic row width stays under 4 MB serialized.
- Day windows use `@date-fns/tz` (`TZDate`) for local midnight and wall-clock→UTC preset conversion; no fixed offsets (Egypt observes DST). Verify: `lib/day-window.test.ts` on the spring-forward and fall-back dates, including a preset landing in the skipped hour.
- `getTodayWork` computes `doneToday`, `conversationsToday`, `demosBookedToday` and `newTouchedToday` in one grouped query over `lead_activities where occurred_at >= $localMidnight` using `count(distinct lead_id) filter (...)`; `newTouchedToday` = leads whose `min(occurred_at)` over contact types is today (not "any contact today"). Verify: service test with a lead first contacted yesterday and again today (not counted as new).
- Bulk transaction bounds: `bulkSetStatus` sets a 10 s statement timeout on its transaction; the bulk test measures 100 ids and the limit drops to 50 if p95 exceeds 5 s. Verify: bulk test timing note in the PR.
- G3 exception 1 widened: "conversation" activity types that reset `followUpCount` are `whatsapp_reply`, `call`, `demo_agreed`, `demo_scheduled`, `demo_done`. `sales:recompute --dry-run` prints the per-bucket delta (leads entering/leaving each Today bucket), not only a count. Verify: `lib/derived.test.ts`; dry-run output reviewed by the user before `--yes`.
- Pinned Up next unpins when its id is absent from a post-write response (parked elsewhere, do-not-contact, deleted) and the next lead takes its place. Verify: `lib/today-session.test.ts`.
- Shortcuts also map `Numpad1`-`Numpad9`; the `?` panel says `C` on a desktop copies the number and marks the call started. Router log lines are called "activity log lines", not an audit trail, in docs. The CSV phone allowance is documented as deliberate.
- Writing tests run against a Neon branch or local DB only, never the `.env` production database; the PR description states which. Verify: test setup asserts the DB host is not the production host.
<!-- /autoplan-accepted:eng -->
## Review record

<!-- autoplan-accepted:ceo -->
- Pipeline default sort stays `createdAt desc` (newest first) when no sort is in the URL: the sell-first sprint's distributor first-touch step opens new batches "from the top of `/sales/leads`" (sprint design, commit c956ef0, line 102). Verify: `server/filters.test.ts` asserts `pipelineSortExpr([])` orders by `createdAt desc`.
- Pipeline gains a `businessType` column (visible by default) and a text/faceted filter on it, server-side via `buildPipelineWhere`, so the distributor track (`businessType = "distributor"`) can be isolated. Verify: `server/filters.test.ts` case for `businessType`.
- Today's work gains keyboard shortcuts scoped to the Up next card: `C` call (tel link), `W` WhatsApp, `1`-`9` the visible outcome buttons in order, `S` skip, `?` shows the shortcut list. Disabled while focus is in an input, textarea, select or open popover/dialog. Shortcut hints are visible on the buttons (kbd) and announced via `aria-keyshortcuts`. Verify: unit test of the key → action mapper in `lib/outcomes.test.ts` (or a sibling `today-shortcuts.test.ts`) including the "focus in input → ignored" case; human checklist item.
- The "All done for today" empty state shows how many promised follow-ups are due tomorrow (count of prospect leads with `nextActionAt` within the next Cairo-local day), returned by `getTodayWork` as `dueTomorrow`. Verify: service-level unit test or `today-rules`-style pure helper test for the day-boundary computation.
- No change to the logged-activity contract: every outcome button and bulk action goes through `service.logActivity` (or `parkLead`), so the sprint's day-14 read-only query over `lead_activities` keeps counting the same rows. Verify: `lib/outcomes.test.ts` asserts each outcome produces a payload accepted by `logActivityInputSchema`.
- NOT in scope (deferred, recorded in `docs/sales-pipeline.md` "Not built (by design)" in the same change): WhatsApp message templates per bucket (deferred by the sell-first design, c956ef0 line 11); kanban board view (L effort, not a sprint pain); sprint/track metrics widget (sprint mandates a read-only SQL query). Skipped: persisted saved views (URL quick-view chips cover it); "Export selected" bulk action (export of the filtered set covers it).
- Part A and Part B are independently shippable. Files and tests are listed per part: Part B = `lib/outcomes.ts`(+test), `lib/today-shortcuts.ts`(+test), `lib/day-window.ts`(+test), `lib/today-session.ts`(+test), `service.ts` (`getTodayWork` additions + `logActivity` executor refactor), `today-page.tsx`, `today-up-next-card.tsx`, `today-queue.tsx`, `outcome-buttons.tsx`, `today-lead-row.tsx`, translations. Part A = `server/schemas.ts`, `server/filters.ts`(+test), `router.ts`, `leads-table-page.tsx`, `pipeline-*.tsx`, `core/data-table/lib/csv.ts`(+test), translations. Part A ships now, not after the sprint's day-14 gate (UC1b, the owner's call at the final gate, 2026-10-23).
- Outcome table (all saves call the existing `sales.logActivity` tRPC mutation, so `demo_scheduled` still triggers the Inngest Meetings provisioning in the router): call set — Interested → type `demo_agreed`, channel phone, status `demo_agreed`; Book demo → `demo_scheduled`, phone, `demo_scheduled`, needs demo time; Call back → `call`, phone, `callback_scheduled`, needs `nextActionAt`; No answer → `no_answer`, phone, `awaiting_reply`; Not interested → `call`, phone, `lost`; Wrong number → `call_unclear`, phone, `blocked_no_number`. WhatsApp set — Sent → `whatsapp_sent`, whatsapp, `awaiting_reply`; Replied → `whatsapp_reply`, whatsapp, `contacted`. Auto-park set — Park (primary) → `sales.park`; They replied → `whatsapp_reply`, whatsapp, `contacted`; Answered a call → `call`, phone, `contacted`. The auto-park bucket never offers another outbound message: the follow-up limit of 2 (`today-rules.ts:92`) exists to avoid a WhatsApp ban. Verify: `lib/outcomes.test.ts` covers every outcome and asserts no auto-park outcome is `whatsapp_sent` or `no_answer`.
- Recommended primary action per bucket: rescue → Call ("book the demo"); overdue → Call ("keep the promise"); followUp → WhatsApp when `whatsappStatus = confirmed`, else Call; newQueue → Call; autoPark → Park. A lead with no phone gets "Open lead" as primary and Call/WhatsApp are disabled with a visible reason. Verify: `lib/outcomes.test.ts` table test over bucket × whatsappStatus × hasPhone.
- Failed save: the optimistic removal is rolled back (lead returns to its previous position and stays Up next if it was), an error toast shows `sales.logFailed`, and nothing advances. Double-submit is blocked while a save is pending. Verify: pure session reducer in `lib/today-session.ts` tested in `lib/today-session.test.ts`; human checklist (save while offline).
- Skip: skipped lead ids live in client state (sessionStorage keyed by Cairo date, wrapped in try/catch, works without storage) and are re-applied after every refetch, moving those leads to the end of the queue. Verify: `lib/today-session.test.ts`.
- Progress: `doneToday` = distinct prospect leads with any activity whose `occurredAt` is on or after Cairo-local midnight (includes parks and status changes); "Left" = `totalActionable` from the latest `sales.today`; bar = done / (done + left), 0 when both are 0. Day boundaries come from a pure `lib/day-window.ts` (`startOfLocalDay`, `startOfNextLocalDay` given `now` + timeZone), which also defines `dueTomorrow` (leads with `nextActionAt` in [next local midnight, the one after)). Verify: `lib/day-window.test.ts` including a UTC-late-evening case that is already "tomorrow" in Cairo.
- Today refetches only `sales.today` after a save (counters moved to Pipeline); Pipeline mutations invalidate `sales.list` and `sales.counters` by `queryKey`, never a bare `invalidateQueries()`.
- Bulk "Change status" offers only `parked` and `lost`. Terminal statuses (`lost`, `won`, `parked`, `blocked_no_number`) set via `logActivity` also stamp `nextActionDoneAt` on open promises, so a lost lead cannot reappear in Overdue. Verify: service-level test that a lost lead with an open promise has `nextActionAt = null` after the log.
- `service.logActivity` is refactored to take an executor (the `Executor` type in `server/recompute.ts`) so bulk mutations run every lead's log inside one transaction; `bulkPark`/`bulkSetStatus` cap input at 100 ids and are droppable if Part A ships trimmed. Verify: typecheck + a bulk test.
- CSV exports neutralise formula injection: `core/data-table/lib/csv.ts` `escapeCell` prefixes `'` to cells starting with `=`, `+`, `-`, `@`, tab or CR (fixes every table, not just sales). Verify: `csv.test.ts`.
- Filter/sort details: `businessType` is a text (ilike, sanitized) filter; `doNotContact` is a faceted yes/no filter in the toolbar; `lastContactedAt`, `followUpCount`, `nextActionAt` filter and sort on the `LeadsTable` cache columns only (no joins to activities). Quick-view chips and counter-badge click are URL filter presets (no server code) and count as G1 parity.
- Shortcut handling lives in a pure `lib/today-shortcuts.ts` key → action mapper (`C`, `W`, `1`-`9`, `S`, `?`; ignored when the event target is an input/textarea/select/contenteditable or a dialog/popover is open). Verify: `lib/today-shortcuts.test.ts`.
- Shortcut mapper is layout-independent and gated: it matches `event.code` (`KeyC`, `KeyW`, `KeyS`, `Digit1`-`Digit9`, `Shift`+`Slash`), ignores Ctrl/Alt/Meta combinations, and receives the card's currently enabled actions; a key whose action is hidden or disabled does nothing, and digit keys beyond the visible outcome count do nothing. Verify: `lib/today-shortcuts.test.ts` with an Arabic-layout event (`key: "ؤ"`, `code: "KeyC"`) and a disabled-action case.
- Up next action gating: in the auto-park bucket the Call and WhatsApp buttons (and `C`/`W`) are hidden; for a lead with no usable phone they are disabled with a reason; WhatsApp is enabled whenever `toWhatsAppUrl(phone)` returns a link, with an "unconfirmed" hint when `whatsappStatus !== "confirmed"`. Verify: `lib/outcomes.test.ts` (enabled-actions helper).
- Daily target is stable: `getTodayWork` also returns `newTouchedToday` (prospect leads whose first contact activity `occurredAt` is today, Cairo-local). Progress "Left" counts newQueue rows only up to `max(0, newQueueCap - newTouchedToday)`; newQueue rows beyond that render in the queue under "Extra (daily goal met)" and do not move the bar. Bucket rules in `today-rules.ts` stay unchanged (G3). Verify: `lib/today-session.test.ts` simulates working 10 new leads with a refilling newQueue and asserts the bar reaches 100% and stays there.
- Time presets never write the past: presets already past in Cairo time are hidden, and every outcome that needs a time rejects `nextActionAt <= now` on the client with an inline error. The time an outcome needs (Book demo, Call back) is always `nextActionAt`, the field `logActivityInputSchema` and the router's Inngest trigger require. Verify: `lib/day-window.test.ts` (preset list at 16:59 vs 17:01 Cairo) and `lib/outcomes.test.ts`.
- Pipeline respects `doNotContact`: for those rows the WhatsApp and Quick log row actions are disabled with a "Do not contact" reason, and the phone renders as plain text instead of a `tel:` link; a "Do not contact" badge shows in the name cell. Verify: human checklist item.
- Counter placement is per part: Part A moves `PipelineCounters` to Pipeline; until Part A ships, Part B keeps `PipelineCounters` on Today, collapsed below the queue. `docs/sales-pipeline.md` is updated by whichever part ships first and again by the second.
- `logActivity` transaction handling: export `Executor` from `server/recompute.ts`; split into `logActivityInTx(tx, input, actorId)` (no transaction of its own) and `logActivity(db, ...)` which wraps it in `db.transaction`; `parkLead` gets the same split; bulk mutations call the `InTx` variants inside one `db.transaction`. Promise discharge becomes explicit: stamp `nextActionDoneAt` when `isContactActivity(type)` OR `pipelineStatus` is terminal (`lost`, `won`, `parked`, `blocked_no_number`). Verify: service test for both discharge branches and for a status_change to a non-terminal status (no discharge).
- CSV guard is phone-safe and round-trips: `escapeCell` prefixes `'` only to strings starting with `=`, `@`, tab or CR, or starting with `+`/`-` when the value is not phone/number-shaped (`/^[+-]?[\d\s().-]+$/`); `parseCsvToObjects` strips a leading `'` only when it is followed by one of `= + - @`. `EXPORT_ROW_LIMIT` moves from `users/server/filters.ts` to `core/data-table` and both features import it there. Verify: `csv.test.ts` (`+201001234567` unchanged, `=HYPERLINK(...)` prefixed, round trip restores the original).
- Supersedes earlier prose where they differ: B1.2's skip is kept in sessionStorage for the Cairo day (not "not persisted"); B3's `doneToday` counts any activity (not only contact activities); the Files list additionally includes `lib/today-shortcuts.ts`, `lib/today-session.ts`, `lib/day-window.ts` (each with a test), and modifies `server/recompute.ts`, `core/data-table/lib/csv.ts` (+test) and `users/server/filters.ts` (EXPORT_ROW_LIMIT import).
- G3 exception 1 (taste, surfaced at the gate): an answered `call` is a conversation, so in `lib/derived.ts` `computeDerived` it resets `followUpCount` to 0 the same way `whatsapp_reply` does and is no longer in `FOLLOW_UP_ACTIVITY_TYPES` (outbound attempts become `whatsapp_sent`, `no_answer`, `call_unclear`). Existing leads are re-derived once with the existing `recomputeLeadDerived` over every prospect (a data step: `.env` points at production Neon, so it runs only after explicit confirmation). Verify: `lib/derived.test.ts` cases (answered call resets; no_answer counts; two no_answers reach the limit) and `today-rules.test.ts` stays green.
- G3 exception 2 (taste, surfaced at the gate): `isSuppressed` in `today-rules.ts` also suppresses `lost`, `won` and `blocked_no_number` (in addition to `parked` and `doNotContact`), so terminal leads never appear in any Today bucket, including Auto-park. Verify: new `today-rules.test.ts` cases, one per terminal status with 2+ follow-ups.
- `getTodayWork` reads `getSalesSettings()` itself and returns `{ timeZone, newQueueCap, now }` alongside `doneToday`, `dueTomorrow` and `newTouchedToday`; the effective cap is the router input override, else the settings value, else the default 10. The client uses the returned `timeZone`/`now` for presets and the sessionStorage date key. Verify: service test for the cap precedence.
- Progress semantics: a lead logged today that becomes due again the same day (e.g. Call back at 17:00) counts in both Done and Left, so the bar can dip; this is accepted and documented. "All done for today" shows when Left = 0; any "Extra (daily goal met)" newQueue rows stay listed below it as optional.
- Outcome set shown on Up next: the set matching the bucket's primary action (call set when primary is Call, WhatsApp set when primary is WhatsApp, auto-park set in Auto-park). Pressing the other channel's button (opening `tel:` or the WhatsApp link) switches the visible set to that channel's outcomes. Digit keys map to the visible set in display order. Verify: `lib/outcomes.test.ts` (`outcomesFor(bucket, lastChannel)`).
- Shipping order dependency: `server/service.ts` and `server/recompute.ts` belong to both parts. Part A also rewrites `listPipeline` and adds `exportRows` in `service.ts`. Whichever part ships first carries the `logActivityInTx`/`Executor` refactor, the terminal-status discharge and the `derived.ts` change. Part A's list also includes `users/server/filters.ts` and `users/server/queries.ts` for the `EXPORT_ROW_LIMIT` move.
- `EXPORT_ROW_LIMIT` moves to a plain module `src/features/core/data-table/lib/limits.ts`, imported by path (never through the client `index.ts` barrel) from server code.
- Discharge order: in `logActivityInTx` the open-promise stamp (contact activity OR terminal status) runs before the new activity is inserted, as in the current contact path (`service.ts:72-83`), so a terminal log that carries its own `nextActionAt` keeps that new promise open.
- Undo window for terminal outcomes: "Not interested" (lost), "Wrong number" (blocked_no_number) and "Park" hold the write client-side for 5 seconds behind a toast with an Undo button; the lead leaves Up next immediately, Undo restores it and nothing is written; after 5 s (or on page hide via `visibilitychange`) the write is sent. Non-terminal outcomes save immediately. Reopening an already-written terminal lead stays possible from the lead detail page's Quick log (status → contacted). Verify: `lib/today-session.test.ts` (pending → undo → no write; pending → timeout → write; pending → page hide → write).
- Call button works without a softphone: next to the `tel:` button the Up next card shows the number large in an LTR island with a Copy button; on desktop widths the Copy button is the secondary action. Verify: human checklist item (desktop and phone).
- Progress shows "Conversations today" (distinct leads with an answered `call`, `whatsapp_reply`, `demo_agreed` or `demo_scheduled` today) next to the Done/Left bar, so parks and status changes cannot fill the headline alone. Returned by `getTodayWork` as `conversationsToday`. Verify: service test.
- G3 exceptions ship dated: the change date is written in `docs/sales-pipeline.md` (and noted for the sell-first day-14 read) so the read can split before/after; the one-time production recompute runs only after explicit user confirmation and logs the number of leads whose derived values changed.
- Baseline before shipping Part B: one read-only query over `lead_activities` records leads touched per day, median hours between logs and demos booked per week for the sprint so far, written into `docs/sales-pipeline.md`; re-read two weeks after ship. Read-only against production, run only after the user confirms.
- Spec consolidation is the first implementation step: fold every accepted requirement into the Part A / Part B / Cross-cutting / Tests / Files sections and delete superseded prose, so the implementer reads one spec.
- "Why build, not buy" line added to `docs/sales-pipeline.md`: the pipeline already owns bucket rules, the WhatsApp follow-up safety limit, Meetings demo provisioning and bilingual RTL; an external CRM would duplicate those.
- The CSV formula-injection guard and the `EXPORT_ROW_LIMIT` move ship as their own small PR (they touch every table), not inside the sales change.
- `logActivityInTx` throws `NOT_FOUND` when the lead id is not a prospect (today the status update silently matches 0 rows); the client shows a "Lead not found" toast and drops it from the session. The Pipeline export shows "First 50,000 rows exported" when the cap is hit. Verify: service test (non-prospect id → NOT_FOUND); filters/export test at the cap.
- Audit log lines: `sales.export` (userId, row count, filters) and `sales.bulk` (userId, action, count, target status) via the router's existing `console.info` pattern. Verify: code review.
- Stale-refetch guard: before the optimistic removal, cancel in-flight `sales.today` queries; the session keeps a `doneIds` set applied over every refetch until the server stops returning those ids. Verify: `lib/today-session.test.ts` releases a stale response after a write and asserts the lead stays hidden.
- When every remaining lead has been skipped, the card shows an "All remaining leads skipped" note with a "Start over" button that clears the skip list. Verify: `lib/today-session.test.ts`.
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- Up next card visual order (top to bottom): (1) identity row: name (title size), Arabic name, location, days since contact; (2) why now: reason sentence, then opening angle in `muted-foreground`; (3) contact zone: the phone number large in an LTR island (dominant element) with the bucket's recommended action as the ONLY `variant="default"` button on the card, Copy and WhatsApp as `outline`; (4) channel switch + outcome row; (5) tertiary text links: Skip, More details. Everything else is `outline` or `ghost`.
- Outcomes are always visible; before the primary action fires they render muted under the label "After you call: how did it go?" (WhatsApp: "After you message: what happened?"); once the primary action fires, the row is promoted to normal emphasis and focus moves to the first outcome. The triggering action and channel are remembered per lead for the session. Verify: `lib/today-session.test.ts`.
- Up next is pinned: the session stores the Up next lead id and keeps it until the operator saves, skips or promotes another row; a refetch that surfaces a higher-priority lead puts it in the queue with a "New" marker, never replacing Up next. Verify: `lib/today-session.test.ts` (refetch with a new rescue lead keeps the pinned lead).
- Progress header: headline is the bar plus "N of M done" (EN) / Arabic equivalent; "Conversations today: K" is a secondary stat chip; a dip is not animated. Copy keys in both `sales-en.ts` and `sales-ar.ts`.
- Pipeline chips: the counter strip and quick-view chips merge into one chip row where each chip shows its count; clicking a chip replaces the status filter and keeps other filters; a chip is active only when the status filter equals its preset exactly. (Part A.)
- States table (both pages): Today — loading: skeleton matching Up next card + 4 queue rows; error: inline `Alert` with translated message + Retry; background refetch: no blanking, a small inline spinner in the header only; empty precedence: (a) no prospects at all → "No leads yet" + link to Pipeline "New lead"; (b) Left = 0 → "All done for today" with recap (conversations, demos booked today, due tomorrow) and any Extra rows listed below as optional; (c) all remaining skipped → note + "Start over". Pipeline — loading: kit skeleton; empty with filters → "No leads match these filters" + "Clear filters"; empty with no prospects → "No leads yet" + "New lead"; export pending → button pending state; export failure → error toast; cap → inline notice under the toolbar. Verify: human checklist rows for each state.
- Bulk terminal actions confirm first: an `AlertDialog` shows the count and target status ("Mark 12 leads as Lost?"); the action bar shows a pending state; select-all selects the current page only, capped at 100 with an inline notice; success clears selection and toasts the count; failure toasts "Nothing changed" (one transaction).
- Undo window details: pending writes also flush on route change and component unmount (not only `visibilitychange`); toasts stack and each Undo restores its own lead; progress updates optimistically and Undo reverses it. Verify: `lib/today-session.test.ts`.
- Time picker: expands below the outcome row in place (the outcome row stays visible but disabled); digit shortcuts are suspended while it is open; when every preset is past, only the custom datetime field shows with a note; times are entered and shown in Cairo time with a "Cairo time" label when the device timezone differs; a Book demo whose Meetings room fails to provision shows on the lead's existing demo card as "Room pending" (current behaviour).
- Channel switch: a two-option segmented control (Call / WhatsApp) above the outcome row reflects the current outcome set and can be switched manually; pressing a channel button also sets it. Hidden in Auto-park.
- Promoting a queue row puts the previous Up next lead back in its original slot (promoting is not skipping). Verify: `lib/today-session.test.ts`.
- `getTodayWork` also returns `demosBookedToday` (distinct leads with a `demo_scheduled` activity today) for the All done recap.
- Stage-group badge tokens: open (`new`, `blocked_no_number`) → `bg-muted text-muted-foreground`; in conversation (`contacted`, `awaiting_reply`, `callback_scheduled`) → `bg-primary/10 text-primary`; demo (`demo_agreed`, `demo_scheduled`, `demo_done`) → warning token (`bg-warning/10 text-warning`, amber fallback per global rules); won → success (emerald per global rules); closed (`lost`, `parked`) → `outline` muted. No raw palette classes.
- Overdue next-action shows an icon plus the text "Overdue" (sr-only on narrow widths) in `text-destructive`, never colour alone.
- Pipeline below 768px: the table scrolls horizontally inside its container with the name column pinned to inline-start (kit pinning); default visible columns unchanged.
- Disabled reasons render as inline `muted-foreground` text under the button group; disabled controls use `aria-disabled` + `aria-describedby` so the reason is reachable by keyboard and screen readers.
- Kbd hints and the `?` shortcut list are hidden under `(pointer: coarse)`.
- `C` means "start call": on a coarse pointer it opens `tel:`; on a fine pointer it copies the number (and marks the call started, promoting the outcome row). Verify: `lib/today-shortcuts.test.ts` with both pointer modes.
- Outcome buttons: one row on `sm`+, two-column grid below `sm`; terminal outcomes (Not interested, Wrong number) are grouped last and use the destructive outline style.
- Advancing to the next lead uses a ≤200 ms crossfade (no directional slide), disabled under `prefers-reduced-motion`.
- The queue renders as a plain list inside one surface (rows separated by dividers), not a stack of cards; only Up next is a raised surface.
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- Spec consolidation happens before implementation handoff (not during it): one spec with a per-PR table (files, tests, verify command) and superseded prose deleted. Ship order: PR0 = CSV guard + `limits.ts` (shared kit); PR1 = `Executor` export, `logActivityInTx`/`parkLeadInTx`, terminal discharge, `derived.ts` call reset, terminal suppression, recompute script; PR2 = Part B (Today); PR3 = Part A (Pipeline, ships now per UC1b). Each PR's gate: `npx vitest run src/features/system/sales` (plus `src/features/core/data-table` for PR0), `npm run typecheck`, `npm run build`, and `npx playwright test e2e/sales-access.spec.ts` on port 3001 (port 3000 is often held by the Meetings dev server).
- Durable deferred writes: pending terminal outcomes are mirrored in sessionStorage (try/catch) as `{ clientId, leadId, payload, createdAt }`. In-app navigation does not flush early: the mutation runs in the shared QueryClient and its toast survives route changes. On `pagehide` the write is sent with `fetch(..., { keepalive: true })`. On the next Today load, any mirrored entry still present is reconciled: the client asks `sales.byId` whether an activity of that type at or after `createdAt` exists; if yes the entry is dropped, if no it is re-sent once, and a toast "1 change could not be saved, retry" offers a retry when that fails. Verify: `lib/today-session.test.ts` cases for flush failure, reconcile-found and reconcile-missing.
- Guarded data scripts: `npm run sales:recompute -- --dry-run|--yes` (new CLI alongside the existing seed CLI, using `recomputeLeadDerived`) prints the redacted target DB host first, refuses without `--yes`, `--dry-run` reports how many leads would change, runs in transactional batches, is idempotent, exits non-zero with lead id + cause on stderr for failures and logs the changed count. The baseline is a checked-in read-only `docs/queries/sales-baseline.sql` plus the exact command in `docs/sales-pipeline.md`. Verify: dry-run against a local/branch DB; unit test for the batch planner.
- Bulk API: one mutation `sales.bulkSetStatus({ ids, status })` with `status: z.enum(["parked","lost"])` and `ids` max `BULK_ACTION_LIMIT` (100); `bulkPark` is dropped. Named constants: `BULK_ACTION_LIMIT` and `EXPORT_ROW_LIMIT` in `core/data-table/lib/limits.ts`; `UNDO_WINDOW_MS = 5000`, `TIME_PRESETS` and the crossfade duration in `sales/lib/today-session.ts` / `lib/day-window.ts`.
- `sales.exportRows` returns `{ rows, truncated, limit }` (fetches `limit + 1` to detect truncation); a truncated CSV is named `sales-pipeline-truncated-<limit>.csv`.
- `getTodayWork` returns a named `TodayWorkSummary` type (exported from `server/schemas.ts`) carrying buckets plus `doneToday`, `dueTomorrow`, `newTouchedToday`, `conversationsToday`, `demosBookedToday`, `timeZone`, `newQueueCap`, `now`.
- Agent-ready errors: service functions throw typed domain errors (`SalesError` with `appCode`, e.g. `SALES_LEAD_NOT_PROSPECT`, `SALES_BULK_LIMIT`, `SALES_DEMO_TIME_REQUIRED`) carrying the lead id; the router maps them to `TRPCError` codes with a message naming the id and the `appCode` in `cause`. Unexpected failures in bulk/export log `{ correlationId, action, count, cause }` server-side and show the correlation id in the toast. The Today save toast distinguishes network (Retry), validation (point at the field) and not-found (drop from session). Audit lines log filter ids, never the global-search text. `docs/sales-pipeline.md` gets an "Errors" section listing each `appCode` and the client behaviour. Verify: service tests assert `appCode` per failure.
- Docs: `docs/sales-pipeline.md` gains the bucket → primary action → outcome-set matrix, the outcome → type/channel/status table and the shortcut table (key/code, action, when disabled); `lib/outcomes.ts` and the `?` overlay read from the same mapper so docs, tests and UI cannot drift. Bulk acting on a whole filtered set is listed under "Not built (by design)".
- Shortcut opt-out: the `?` panel has a "Keyboard shortcuts on/off" toggle stored per viewer in localStorage (try/catch; default on).
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- Stale-refetch guard is time-scoped, not id-scoped (replaces the earlier `doneIds` rule): after a write resolves, in-flight `sales.today` queries are cancelled and the session hides a written lead only in responses whose fetch started before the write resolved; the first post-write response is authoritative, so a lead legitimately due again the same day (Call back at 17:00) reappears. Verify: `lib/today-session.test.ts` (stale pre-write response stays hidden; post-write response with the same lead due again shows it).
- Undo is compensating, not deferred (replaces the sessionStorage mirror / keepalive / reconcile design and the route-change flush rules): terminal outcomes write immediately; Undo within `UNDO_WINDOW_MS` logs a `status_change` back to the previous status and, when the outcome discharged open promises, carries the earliest discharged `nextActionAt` so the promise is re-created; the lead returns to the session at its slot. The timeline shows both rows honestly. Verify: service test (lost then undo restores status and nextActionAt) + `lib/today-session.test.ts`.
- Prospect check before any write: `logActivityInTx` starts with `select id, pipeline_status, next_action_at from leads where id = $1 and kind = 'prospect' for update`; missing → `SalesError(SALES_LEAD_NOT_PROSPECT)`. The row lock serialises concurrent logs on one lead. Verify: service test with a customer-kind lead id and no `pipelineStatus` in the payload.
- Server-side do-not-contact guard: `logActivityInTx` rejects outbound types (`call`, `no_answer`, `call_unclear`, `whatsapp_sent`) for `doNotContact` leads with `SalesError(SALES_DO_NOT_CONTACT)`. Verify: service test.
- Sales export cap is sized to the response limit: `SALES_EXPORT_ROW_LIMIT = 5000` in `core/data-table/lib/limits.ts` (users keep 50,000; their latent size risk goes to TODOs). Verify: export test at the cap with realistic row width stays under 4 MB serialized.
- Day windows use `@date-fns/tz` (`TZDate`) for local midnight and wall-clock→UTC preset conversion; no fixed offsets (Egypt observes DST). Verify: `lib/day-window.test.ts` on the spring-forward and fall-back dates, including a preset landing in the skipped hour.
- `getTodayWork` computes `doneToday`, `conversationsToday`, `demosBookedToday` and `newTouchedToday` in one grouped query over `lead_activities where occurred_at >= $localMidnight` using `count(distinct lead_id) filter (...)`; `newTouchedToday` = leads whose `min(occurred_at)` over contact types is today (not "any contact today"). Verify: service test with a lead first contacted yesterday and again today (not counted as new).
- Bulk transaction bounds: `bulkSetStatus` sets a 10 s statement timeout on its transaction; the bulk test measures 100 ids and the limit drops to 50 if p95 exceeds 5 s. Verify: bulk test timing note in the PR.
- G3 exception 1 widened: "conversation" activity types that reset `followUpCount` are `whatsapp_reply`, `call`, `demo_agreed`, `demo_scheduled`, `demo_done`. `sales:recompute --dry-run` prints the per-bucket delta (leads entering/leaving each Today bucket), not only a count. Verify: `lib/derived.test.ts`; dry-run output reviewed by the user before `--yes`.
- Pinned Up next unpins when its id is absent from a post-write response (parked elsewhere, do-not-contact, deleted) and the next lead takes its place. Verify: `lib/today-session.test.ts`.
- Shortcuts also map `Numpad1`-`Numpad9`; the `?` panel says `C` on a desktop copies the number and marks the call started. Router log lines are called "activity log lines", not an audit trail, in docs. The CSV phone allowance is documented as deliberate.
- Writing tests run against a Neon branch or local DB only, never the `.env` production database; the PR description states which. Verify: test setup asserts the DB host is not the production host.
<!-- /autoplan-accepted:eng -->

<!-- autoplan-baseline-edits:ceo {"sourceSha256":"80afd5092611994f4c8f8f4085acd4d4dd9064af70d2d768fc1530d61cfd9b25","replacements":[{"oldText":"keyboard shortcuts optional (see\n  review).","newText":"keyboard shortcuts are in scope (see accepted requirements)."},{"oldText":"then refetch `sales.today` + `sales.counters` only","newText":"then refetch `sales.today` only"},{"oldText":"- Bulk action bar: Park, Change status, Export selected.","newText":"- Bulk action bar: Park, Change status (parked or lost only)."},{"oldText":"  - Auto-park bucket: Park (primary) · Try once more.","newText":"  - Auto-park bucket: Park (primary) · They replied · Answered a call."}]} -->

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
| 1 | CEO | Mode SELECTIVE EXPANSION | Mechanical | autoplan override | Added capability to an existing module | Other modes |
| 2 | CEO | Keep both parts (Today + Pipeline) in plan; queue sequencing vs sprint as a gate question | Taste | P6 + user direction | User asked for both; sprint doc says build only sprint pain, so sequencing is the user's call | Silently dropping Part A |
| 3 | CEO | Accept keyboard shortcuts on Up next | Mechanical | P2 | In blast radius, S effort, cuts per-lead time during the sprint | — |
| 4 | CEO | Accept `businessType` column + filter | Mechanical | P2 | S effort, directly serves the sprint's distributor track | — |
| 5 | CEO | Accept `dueTomorrow` in empty state | Mechanical | P2 | S effort, closes the day with a next step | — |
| 6 | CEO | Defer WhatsApp message templates | Mechanical | P3 + binding decision | Templates were part of the handover the sprint deferred (c956ef0 line 11) | Building now |
| 7 | CEO | Defer kanban board view | Mechanical | P3 | L effort, outside blast radius, not a sprint pain | — |
| 8 | CEO | Defer sprint/track metrics widget | Mechanical | P3 + binding decision | Sprint doc mandates a read-only SQL query, not a counter strip | — |
| 9 | CEO | Skip persisted saved views | Mechanical | P4/P5 | Quick-view chips over URL filters already cover it | — |
| 10 | CEO | Preserve newest-first default sort | Mechanical | P1 | Sprint workflow depends on it | Changing default |
| 11 | CEO | Apply all spec-review pass-1 fixes (outcome table, rollback, skip, progress, bulk whitelist, CSV guard, executor) | Mechanical | P1/P5 | Each was a concrete gap with one clear fix | — |
| 12 | CEO | Drop "Try once more" from Auto-park | Mechanical | P1 (safety) | A third outbound message breaks the 2-attempt WhatsApp-ban limit | Keeping it |
| 13 | CEO | Drop "Export selected" | Mechanical | P4/P5 | Filtered export covers it | — |
| 14 | CEO | Apply all spec-review pass-2 fixes (event.code shortcuts, daily target, past-time guard, doNotContact gating, counters per part, InTx split, phone-safe CSV) | Mechanical | P1/P5 | Concrete gaps | — |
| 15 | CEO | Answered `call` resets follow-up count + one-time recompute | Taste | P1 | Without it, leads you actually spoke to drift into Auto-park; but it changes derived data and touches prod data | Suppress-only fix |
| 16 | CEO | Suppress lost/won/blocked leads from all Today buckets | Taste | P1 | Terminal leads with 2+ attempts currently surface in Auto-park | Leaving bucket rules frozen (G3) |
| 17 | CEO | Accept progress-bar dip when a done lead becomes due again | Taste | P5 | Exact dedup adds complexity for a rare case | Dedup logic |
| 18 | CEO | Approve CEO scope documents at 0H (spec not re-verified after pass 3) | Mechanical | P6 | 3-launch cap reached; 9/9 pass-3 fixes verified in text | Another review loop |
| 19 | CEO | Part A after day-14 gate (ship Today first) | **User Challenge** | — | Step 0 and the CEO voice both recommend it; it changes the user's stated scope, so it waits for the gate. **Resolved 2026-10-23: rejected (UC1b), the owner keeps both parts now** | Auto-cutting Part A |
| 20 | CEO | 5 s undo window for terminal outcomes | Mechanical | P1 | One mis-tap otherwise silently drops a live prospect | Confirm dialog (slower) |
| 21 | CEO | Show number + Copy beside `tel:` | Taste | P1 | Operator setup (phone vs laptop) is unverified; this works for both | Cutting shortcuts |
| 22 | CEO | "Conversations today" beside progress | Mechanical | P1 | Bar alone rewards parking | — |
| 23 | CEO | Date the G3 exceptions; confirm before prod recompute | Mechanical | P1 | Keeps the day-14 read interpretable | Separate PR |
| 24 | CEO | Read-only baseline before shipping | Mechanical | P1 | No other way to know the redesign helped | — |
| 25 | CEO | Consolidate spec as step 1 of implementation | Mechanical | P5 | Amendment layer contradicts body prose | — |
| 26 | CEO | Keep skip persistence, daily target, bulk executor despite "N=1" critique | Taste | P1 | Each fixes a concrete failure found by spec review | Cutting to the CEO voice's v1 |
| 27 | CEO | CSV guard + limit move as separate small PR | Mechanical | P5 | Touches every table, unrelated to sales | Bundling |
| 28 | CEO | `logActivityInTx` throws NOT_FOUND for non-prospect ids; export shows truncation notice | Mechanical | P1 | Two silent failures in the error map | — |
| 29 | CEO | Audit log lines `sales.export` / `sales.bulk` | Mechanical | P1 | Prospect PII leaves the system via export | — |
| 30 | CEO | Cancel in-flight `sales.today` + keep `doneIds` over refetch | Mechanical | P1 | Stale refetch would resurrect a logged lead | — |
| 31 | CEO | "All skipped" note when every lead is skipped | Mechanical | P1 | Otherwise the queue cycles silently | — |
| 32 | Design | Skip generated mockups | Mechanical | kernel rule 7 | Board is an interactive browser flow; banned in this repo; offered at gate | Running the board |
| 33 | Design | Up next visual order, single default button, pinned Up next, states tables, bulk confirm, undo flush, picker spec, empty precedence, promote-returns-slot, recap, overdue icon, mobile scroll, aria reasons, kbd on coarse, outcome grid, crossfade, queue as list | Mechanical | P5/P1 | Structural gaps with one clear fix each | — |
| 34 | Design | Outcomes muted until the primary action fires, then promoted | Taste | P5 | Prevents "No answer" before calling; alternative is always-active | Always active |
| 35 | Design | Visible Call/WhatsApp segmented switch | Taste | P5 | Makes the outcome mode visible; alternative is implicit switching | Implicit only |
| 36 | Design | Stage-group badge token map | Taste | P5 | Groups chosen by funnel stage; colours are a taste call | Other groupings |
| 37 | Design | `C` copies on fine pointers, dials on coarse | Taste | P5 | Desktop `tel:` usually prompts an OS handler | Always `tel:` |
| 38 | DX | Mode DX POLISH; persona = AI coding agent / contributor implementing against `service.ts` | Mechanical | autoplan override + P6 | Internal tool; the dev surface is the service API (router.ts:22-23) | Other personas |
| 39 | DX | Consolidate spec + explicit PR0-PR3 order with gate commands | Mechanical | P5 | Main TTHW cost was merging 60 amendments | — |
| 40 | DX | Durable deferred writes via sessionStorage mirror + keepalive + reconcile on load | Mechanical | P1 (CAP4) | Page-hide flush could fail silently | Schema-level idempotency key (needs migration) |
| 41 | DX | Guarded `sales:recompute` script + checked-in baseline SQL | Mechanical | P1 (CAP4) | `.env` points at prod; no script existed | Ad-hoc queries |
| 42 | DX | Single `bulkSetStatus` with Zod enum; named limits/constants; `truncated` flag; `TodayWorkSummary` type | Mechanical | P5 | Naming overlap and magic numbers | Keeping `bulkPark` |
| 43 | DX | Typed `SalesError` app codes, correlation ids, three-way save toast, Errors doc | Mechanical | P1 (CAP6) | Bare NOT_FOUND / "Nothing changed" were undebuggable | — |
| 44 | DX | Docs tables from one mapper; shortcut on/off toggle | Mechanical | P5 | Drift prevention; escape hatch | — |
| 45 | Eng | Time-scoped stale-refetch guard | Mechanical | P1 | id-scoped guard hid same-day callbacks (H1) | `doneIds` until gone |
| 46 | Eng | Compensating undo replaces deferred writes (supersedes D40 mechanism) | Taste | P5 | Deferred writes needed hand-rolled tRPC keepalive + fuzzy reconcile; compensation is explicit | Keep deferral with exact-occurredAt reconcile |
| 47 | Eng | Prospect `select ... for update` before insert; server do-not-contact guard | Mechanical | P1 | NOT_FOUND after insert missed most cases (H3); UI-only guard (L5) | — |
| 48 | Eng | Sales export cap 5,000 | Mechanical | P1 | 50k JSON exceeds Vercel response limit (H2) | Streaming route (more code) |
| 49 | Eng | `@date-fns/tz` + DST tests | Mechanical | P1 | Egypt DST (M2) | Fixed offset |
| 50 | Eng | One grouped aggregate query; `newTouchedToday` via min(occurred_at) | Mechanical | P3 | M3 | Four queries |
| 51 | Eng | Bulk statement timeout + measured limit | Mechanical | P1 | M4 | — |
| 52 | Eng | Demo activity types also reset follow-ups; per-bucket dry-run delta | Taste | P1 | "Interested" logs demo_agreed; extends G3 exception 1 | Only call + reply |
| 53 | Eng | Unpin vanished Up next; numpad keys; naming; tests on branch DB only | Mechanical | P1 | M6, L2, L4, test safety | — |
| 54 | Eng | Defer admin Playwright fixture + Today flow e2e | Taste | P3 | No admin fixture exists; reducer tests + checklist cover v1 | Build fixture now |

### CEO Step 0

**Pre-review audit.** Branch `feat/anti-bot-signup-leads` (HEAD c8646c0) carries
unrelated bot-guard work; this plan should land on its own `feat/` branch off
`preview`. No stashes, no `TODOS.md` in the repo (deferrals below are recorded
here and will be written into `docs/sales-pipeline.md` "Not built (by design)"
during implementation). No TODO/FIXME in `src/features/system/sales`. No sales
commits on `origin/main` since 2026-10-20, so nothing here is already done.

**Prior learning applied:** `sales-pipeline-unused` (9/10, 2026-10-22): the
pipeline was built for ~44 atelier prospects but outreach never ran; validate
offers through it with zero code before adding tracker features.

**Binding decision found:** `docs/designs/distributor-offer-sell-first.md`
(branch `docs/distributor-offer-sell-first`, commit c956ef0, approved
2026-10-22) chose a 14-day **zero-code** sell-first sprint worked from
`/sales/today`, and says after the sprint: "list what `/sales/today` made
painful during the sprint. Only items on that list are candidates to build
next" (line 154). This request arrives on sprint day 2 and is exactly such a
pain report for Today. Part A (pipeline table parity) is not on any pain list.

**Taste calibration.** Good references: `users/admin/customers-table-page.tsx`
(kit wiring), `users/server/filters.ts` (server filter whitelist),
`sales/lib/today-rules.ts` (pure, injected `now`, structured reasons). Avoid:
current `leads-table-page.tsx` (hand-rolled table, per-filter `useState`, no URL
state) and the 7-field `quick-log-popover.tsx` as the default path.

**Landscape check.** Search not run (no Aside; WebSearch not loaded). In-distribution
knowledge: outbound sales tools (Close, Apollo, HubSpot sequences, Pipedrive
"focus" view) converge on a single-lead "power dialer" view with outcome
buttons and auto-advance, plus a separate filterable list. Layer 3: for one
operator working <=30 leads/day, the win is not features but removing the
decision "who next, what do I do" and making the log a byproduct of the action.

#### 0A. Premise challenge

Real problem: during the sprint the operator has to work out who to contact
and how to log it, row by row, and a log takes 7 fields. The sprint's day-14 gate
is a query over logged activities, so every unlogged touch is lost evidence.
Do-nothing cost: touches happen in WhatsApp but go unlogged, Overdue/Follow-up
buckets go stale, and the gate measures the wrong thing. Part B solves this
directly. Part A solves a proxy (list parity) except for two concrete sprint
needs: newest-first first-touch and isolating the distributor track.

| Premise | Claim | Receipt | Verdict |
|---|---|---|---|
| P1 | Pipeline is a hand-rolled table with no kit features | `src/features/system/sales/admin/leads-table-page.tsx:150-244` | true |
| P2 | Other admin lists use the shared kit | `src/features/system/users/admin/customers-table-page.tsx:19-30` | true |
| P3 | Quick log has 7 fields | `src/features/system/sales/admin/components/quick-log-popover.tsx:168-294` | true |
| P4 | Save invalidates every query, reshuffling the list | `quick-log-popover.tsx:115`, `today-lead-row.tsx:39` | true |
| P5 | `listPipeline` does not sanitize LIKE fragments | `src/features/system/sales/server/service.ts:192-205` | true |
| P6 | Counter strip is whole-pipeline, not today | `service.ts:310-355` | true |
| P7 | Today payload has no done/progress data | `src/features/system/sales/lib/today-rules.ts:76-80` | true |
| P8 | One operator (the founder) works the pipeline | sprint design c956ef0 line 84 | true |
| P9 | Sprint relies on newest-first `/sales/leads` | sprint design c956ef0 line 102; `service.ts:242` | true |

unverified=0

#### 0B. Existing code leverage

| Sub-problem | Existing code | Reuse |
|---|---|---|
| Table shell, URL state, toolbar, filters, export, action bar | `src/features/core/data-table/index.ts:3-40` | Yes, as-is |
| Server filter/sort whitelist | `src/features/system/users/server/filters.ts:39-155` | Pattern copy (sales columns differ) |
| Logging + derived recompute | `service.ts:64-110` (`logActivity`), `service.ts:116-132` (`parkLead`) | Yes, all writes route here |
| Detailed log form | `quick-log-popover.tsx` | Kept behind "More details" |
| WhatsApp link | `src/lib/phone.ts` (`toWhatsAppUrl`) | Yes |
| Calling window | `lib/calling-window.ts` + `getSalesSettings` | Yes |
| Bucket rules | `lib/today-rules.ts` | Unchanged |

Rebuild of `leads-table-page.tsx` is justified: refactoring the hand-rolled
table toward the kit would replace every line anyway.

#### 0C. Dream state

```
CURRENT                         THIS PLAN                          12-MONTH IDEAL
Today = 5 equal-weight lists    Up next card + outcome buttons     Today is a guided session: next
7-field log popover             auto-advance, progress, shortcuts  lead, script, one-tap outcome,
Pipeline = bare table           Pipeline = kit table with URL      reply inbox merged in (WhatsApp
No sense of done                filters, bulk park/status, export  replies auto-logged), per-offer
                                                                   tracks, weekly review page
```
Moves toward the ideal: yes for Today; Part A is parity groundwork.

#### 0D. Alternatives

| Commitment | A (plan as written) | B (Today now, Pipeline after day-14) | C (full CRM: board + sequences) |
|---|---|---|---|
| Today redesign | yes | yes | yes |
| Pipeline kit table | yes | after sprint gate | yes |
| Kanban / sequences | no | no | yes |
| Effort (CC) | M | S-M | XL |
| Respects sprint "build only pain" | partly | yes | no |

Auto-decision: A stays as the plan (user's explicit direction, P6); B is queued
as a gate question (Decision 2). C rejected (P3, outside blast radius).

#### 0F/0G. Cherry-picks (SELECTIVE EXPANSION)

HOLD checks: 20 files (estimate) across server + 2 pages; minimum change for G2
is the Up next card + outcome mapper + targeted refetch; Part A is separable.

10x check: the 10x version makes Today a session runner where logging is a
side effect of acting (tap Call → return → outcome sheet already open).
Delight scan and dispositions:

| # | Proposal | Effort | Decision | Reasoning |
|---|---|---|---|---|
| 1 | Keyboard shortcuts on Up next | S | ACCEPTED | P2, in blast radius |
| 2 | `businessType` column + filter | S | ACCEPTED | P2, serves distributor track |
| 3 | `dueTomorrow` in empty state | S | ACCEPTED | P2, ends the day with a next step |
| 4 | WhatsApp templates per bucket | S | DEFERRED | handover item the sprint deferred |
| 5 | Kanban board | L | DEFERRED | outside radius, not a sprint pain |
| 6 | Sprint/track metrics widget | M | DEFERRED | sprint mandates a read-only query |
| 7 | Persisted saved views | M | SKIPPED | quick-view chips cover it |

#### 0H. CEO plan + spec review loop

CEO summary: `~/.gstack/projects/Mohamed-Magdy-fayed-gateling.com/ceo-plans/2026-10-23-sales-workspace-redesign.md`.
Spec review: 3 launches (cap). Scores 6/10, 7/10, 6/10 (latest 6/10).
49 issues reported in total; all applied as accepted requirements. Pass-3
fixes verified in the exported input (issues verified: 9 of 9) but **spec not
re-verified** by a reviewer. Metrics appended to `analytics/spec-review.jsonl`.
Document approval auto-decided A (Decision 18).

#### 0I. Temporal interrogation

```
HOUR 1 (foundations): derived.ts call-reset + isSuppressed change + tests;
  logActivityInTx split; day-window helpers. Needs: prod-recompute confirmation.
HOUR 2-3 (core):      outcomes.ts / today-session.ts / today-shortcuts.ts pure
  modules + tests; getTodayWork additions. Ambiguity: settings cap precedence.
HOUR 4-5 (integration): Up next card, queue, outcome buttons, refetch scoping,
  sessionStorage skip. Surprise: base-ui Popover focus vs global key handler.
HOUR 6+ (Part A):     filters.ts + grid schema, kit table, bulk mutations,
  csv guard, limits.ts move. Wish-list: an admin e2e fixture (none exists).
```
Effort: Part B human ~3 days / CC ~2-3 h; Part A human ~3 days / CC ~2 h.

### CEO dual voices

Claude CEO subagent: completed (INPUT hash f656853c…, matches snapshot).
Codex: unavailable (`CODEX_MODE: not_authed`; fix: `codex login`). Tag: [subagent-only].

```
CEO DUAL VOICES — CONSENSUS TABLE:
  Dimension                            Claude  Codex  Consensus
  1. Premises valid?                    mostly  N/A    N/A (operator setup unstated)
  2. Right problem to solve?            B yes, A partly  N/A  N/A
  3. Scope calibration correct?         no (A now is early)  N/A  N/A
  4. Alternatives sufficiently explored? no (buy, templates)  N/A  N/A
  5. Competitive/market risks covered?  n/a (internal; time risk)  N/A  N/A
  6. 6-month trajectory sound?          risk: no-undo terminal taps  N/A  N/A
```
Claude voice findings and dispositions: 1 sequencing → User Challenge UC1
(Decision 19); 2 undo → accepted (20); 3 operator setup → Copy number accepted,
premise surfaced at gate (21); 4 dated G3 rollout → accepted (23); 5 baseline →
accepted (24); 6 conversations metric → accepted (22); 7 consolidate spec →
accepted (25); 8 why-build line → accepted; templates stay deferred, bottleneck
premise surfaced at gate; 9 N=1 cuts → kept, taste (26), CSV split out (27);
10 competitive → covered by 1.

### Review Sections

**Current scope.** Mode SELECTIVE EXPANSION (autoplan override). Accepted:
cherry-picks 1-3, spec-review fixes (Decisions 11-18), CEO-voice fixes (20-27).
Deferred: templates, kanban, metrics widget. Skipped: saved views, Export
selected. Pending at gate: UC1 (Part A timing), taste 15/16/17/21/26.

#### Section 1: Architecture

```
                 /sales/today (RSC)                 /sales/leads (RSC)
                       |                                   |
            SalesTodayPage (client)              SalesLeadsTablePage (client)
      +---------+-----------+--------+          useTableUrlState + useDataTable
      |         |           |        |                     |
  UpNextCard  TodayQueue  Progress  (Counters until A)   pipeline-columns / filters /
      |  outcome-buttons    |                            row-actions / bulk-actions
      |  today-shortcuts    |                                  |
  lib/outcomes  lib/today-session  lib/day-window              |
      \            |             /                             |
       trpc.sales.today / logActivity / park        trpc.sales.list / exportRows /
               |                                    bulkPark / bulkSetStatus / counters
          router.ts (assertAdmin) ------------------------------+
               |
          service.ts: getTodayWork | logActivityInTx | parkLeadInTx | listPipeline | exportRows
               |                         |
     lib/today-rules (pure)      lib/derived (pure) <- recompute.ts (Executor exported)
               |                         |
            Postgres: leads (cache cols) + lead_activities (append-only)
```
Data flows (Today save): happy = outcome → (terminal? 5 s pending) →
`logActivity` → tx(stamp promises → insert → status → recompute) → refetch
`sales.today` → next lead. Nil = no lead (empty bucket list) → "All done" state.
Empty = lead with no phone → primary becomes Open lead. Error = mutation
rejects → rollback reducer restores the lead, toast `sales.logFailed`.
State machine (Up next session, client):
```
 idle --select--> active --outcome(non-terminal)--> saving --ok--> advance -> active|empty
                    |                                   \--err--> active (rolled back)
                    +--outcome(terminal)--> pending(5s) --undo--> active
                    |                          \--timeout|pagehide--> saving
                    +--skip--> active(next)    (saving blocks further outcomes)
```
Invalid transitions prevented: outcome while saving (buttons disabled + mapper
ignores), undo after write (Undo removed once sent). Coupling: Today now
depends on settings via `getTodayWork` (justified: timezone/cap). Scaling: one
operator, ~100s of prospects; `getTodayWork` already loads all prospects with
two EXISTS subqueries; at 10x (thousands) still fine; at 100x needs paging of
buckets (not now). Security: every new procedure behind `assertAdmin`. Rollback:
revert the PR; the only data change is the derived recompute, which is
re-derivable by running `recomputeLeadDerived` again on the old code.
Findings: none beyond accepted items.

#### Section 2: Error & Rescue Map

```
 CODEPATH                      | WHAT CAN GO WRONG              | CLASS
 sales.logActivity (outcome)   | network/5xx                    | TRPCClientError
                               | demo time missing              | zod BAD_REQUEST
                               | lead not prospect / deleted    | update hits 0 rows (silent)
 Inngest leadDemoScheduled send| Inngest down                   | caught, console.warn (existing)
 sales.park / bulkPark         | tx failure mid-batch           | DB error → whole tx rolls back
 sales.bulkSetStatus           | >100 ids / bad status          | zod BAD_REQUEST
 getTodayWork                  | settings row missing           | getSalesSettings default
 sales.exportRows              | >50k rows                      | capped, truncation not shown
 sessionStorage (skip)         | blocked/private mode           | try/catch, in-memory fallback
 pending terminal write        | tab closed before 5 s          | pagehide flush; if killed, lost

 CLASS                    | RESCUED | ACTION                         | USER SEES
 TRPCClientError          | Y       | rollback reducer               | error toast, lead back
 zod BAD_REQUEST          | Y       | client validates first         | inline error
 0-row update (bad id)    | N <- GAP| return NOT_FOUND from service  | "Lead not found" toast
 Inngest send failure     | Y       | existing warn log              | demo card "pending room"
 bulk tx failure          | Y       | toast with count, no partial   | "Nothing changed" toast
 export truncation        | N <- GAP| show "first 50,000 rows" note  | silent truncation
 killed tab during pending| N       | accepted (5 s window)          | outcome not saved
```
Gaps resolved (Decision 28): `logActivityInTx` throws NOT_FOUND when the lead
is not a prospect (currently the status update silently matches 0 rows), and
the export button shows a truncation notice at the cap. Killed-tab loss inside
the 5 s window is accepted and named in the human checklist.

#### Section 3: Security & Threat Model
New surfaces: `exportRows`, `bulkPark`, `bulkSetStatus`, extra fields on
`today`. All admin-only via `assertAdmin` (router.ts:31). Input: zod on every
input; ids are uuids; bulk capped at 100; status whitelist. LIKE injection: the
plan adds sanitization that the current `listPipeline` lacks (fix). CSV
formula injection: guarded (separate PR). PII: exports contain prospect phones
(likelihood Med, impact Med): admin-only, same as existing users export; add an
audit log line `sales.export` with userId and row count (Decision 29). No new
secrets or dependencies. Bulk status change is audited by the activity rows.

#### Section 4: Data flow & interaction edge cases
```
 tap outcome -> validate(needsTime? >now?) -> [terminal: pending 5s] -> mutate
   -> tx{stamp promises; insert activity; set status; recompute} -> refetch today
 shadow: nil time -> inline error | past time -> inline error | double tap ->
 disabled while saving | stale list (lead already parked elsewhere) -> server
 logs anyway (append-only); refetch removes it | encoding: Arabic names render
 via React escaping
```
Async ordering: invariant "a lead is never shown as Up next after its outcome
is written". Order 1: write completes, refetch returns → lead absent. Order 2:
an older in-flight `sales.today` refetch resolves after the write → stale list
shows the lead again. Mechanism: cancel in-flight `sales.today` queries before
the optimistic removal (`queryClient.cancelQueries`) and keep the session's
`doneIds` set applied on top of every refetch until the server stops returning
them (Decision 30). Test: `today-session.test.ts` releases a stale response
after the write and asserts the lead stays hidden.

| INTERACTION | EDGE CASE | HANDLED | HOW |
|---|---|---|---|
| Outcome tap | double tap | Y | disabled while saving |
| Outcome tap | navigate away during pending | Y | pagehide flush |
| Book demo | Meetings not configured | Y | existing router path; card shows pending |
| Skip | skip every lead | Y | queue cycles; "All skipped" note (Decision 31) |
| Queue | 0 leads | Y | All done state |
| Queue | 200 leads | Y | grouped, newQueue capped |
| Pipeline | filter returns 0 | Y | kit empty state |
| Pipeline | bulk on 100 rows | Y | single tx |

#### Section 5: Code quality
Fits patterns: pure lib modules mirror `today-rules.ts`; server filters mirror
`users/server/filters.ts`. Risk: `outcomes.ts` branching (bucket × channel ×
phone × whatsapp) exceeds 5 branches; implement as data tables, not nested ifs.
`today-page.tsx` must stay small: state in a `useTodaySession` hook backed by
the pure reducer. No other findings.

#### Section 6: Tests
```
 NEW ITEM                         | TYPE | HAPPY | FAILURE | EDGE
 lib/outcomes                     | unit | table rows | invalid combos | no phone, autoPark
 lib/today-session reducer        | unit | advance | rollback, stale refetch | undo/timeout/pagehide
 lib/today-shortcuts              | unit | keys | disabled action | Arabic layout, modifiers
 lib/day-window                   | unit | boundaries | — | late-UTC, 16:59/17:01 presets
 lib/derived (call reset)         | unit | reset | — | 2 no_answers
 today-rules (terminal suppress)  | unit | suppressed | — | each terminal status
 service logActivityInTx          | integ| discharge | NOT_FOUND | non-terminal status_change
 server/filters                   | unit | each filter | sanitize | unknown sort, default sort
 csv                              | unit | phone kept | formula prefixed | round trip
 Today/Pipeline UI                | human checklist (no admin e2e fixture) |
```
no_claim for the UI rows = rendered behavior and RTL (no admin Playwright
fixture; human checklist covers it). Flaky risk: day-window tests inject `now`.
Friday-2am test: `today-session` stale-refetch + rollback. Chaos: kill network
mid-save.

#### Section 7: Performance
`getTodayWork` adds three counts (`doneToday`, `conversationsToday`,
`newTouchedToday`, `dueTomorrow`) — run as one aggregate query over
`lead_activities` filtered by `occurredAt >= dayStart` (index on
`lead_activities(lead_id, occurred_at)` exists per the append-only log design;
verify during implementation). Pipeline sort on cache columns; `nextActionAt`
indexed. Export capped at 50k. No N+1.

#### Section 8: Observability
Existing: console logs in router. Add: `sales.export` audit line (Decision 29),
`sales.bulk` line with count and status, recompute row-count log. Metric of
success: the baseline query (accepted) re-read after two weeks. No dashboards
needed for one operator.

#### Section 9: Deployment & rollout
No schema migration. One data step (derived recompute) behind explicit user
confirmation, run after deploy. Branch flow `feat/<slug>` → `preview` → `main`.
Part B can deploy alone. Rollback: revert; re-run recompute on old code to
restore old `followUpCount` semantics. Post-deploy check: open /sales/today,
log one outcome, confirm the activity row and that the lead advanced.

#### Section 10: Long-term trajectory
Debt: amendment-layered spec (fixed by consolidation step). Reversibility 4/5
(the derived-semantics change is the only sticky part). Platform potential:
`lib/outcomes.ts` becomes the single place an MCP sales tool or a WhatsApp
inbox can reuse. A 12-month engineer reads pure modules + one hook.

#### Section 11: Design & UX
```
 [Today] header: Done N · Left M · Conversations K  [calling-window note]
    -> Up next card (primary action, outcomes, Copy number, Skip)
         -> outcome -> (terminal: Undo toast 5s) -> next lead
    -> Queue (by bucket, "Extra (daily goal met)") -> click promotes to Up next
    -> All done (dueTomorrow, link to Pipeline)
```
| FEATURE | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL |
|---|---|---|---|---|---|
| Up next | skeleton card | All done | rollback + toast | advance + toast | no phone → Open lead |
| Queue | skeleton rows | hidden | — | updates | capped newQueue |
| Pipeline table | kit loading | kit empty | toast | rows | export truncation note |
Deep design review follows in Phase 2 (/plan-design-review).

### Required outputs (CEO)

REALITY: premise-table pass 9 premises with receipts, unverified=0 src/features/system/sales/admin/leads-table-page.tsx:150
REALITY: already-done pass no sales commits on origin/main since 2026-10-20 4e4f654
REALITY: surface-check pass routes and tRPC procedures exist; new ones marked new src/features/system/sales/server/router.ts:35
REALITY: binding-decisions finding sell-first sprint is zero-code and build-only-pain; Part A timing is UC1 c956ef0
REALITY: numbers pass perPage 20 [measured: leads-table-page.tsx:41], cap 10 [measured: today-rules.ts:104], follow-up limit 2 [measured: today-rules.ts:103], export cap 50k [measured: users/server/filters.ts:25], bulk cap 100 [estimated] src/features/system/sales/lib/today-rules.ts:100
REALITY: deferred-asks pass no linked issue for this request docs/sales-pipeline.md:149
REALITY: pr-count pass no ship-policy; default one PR per wave, plus the separate CSV PR (Decision 27) src/features/core/data-table/lib/csv.ts:3

**NOT in scope.** Deferred: WhatsApp templates (sprint deferred them), kanban
(L, not a pain), sprint metrics widget (sprint mandates a SQL query). Skipped:
saved views, Export selected. Pending gate: Part A timing (UC1).

**What already exists.** See 0B table: data-table kit, users filters pattern,
`logActivity`/`parkLead`, `QuickLogPopover`, `toWhatsAppUrl`, calling-window,
bucket rules. All reused.

**Dream state delta.** After Part B, Today is a guided session with one-tap
logging and progress; still missing for the 12-month ideal: auto-logged
WhatsApp replies, per-offer tracks, weekly review page.

**Error & Rescue Registry.** Section 2 table (10 rows, 3 gaps → 2 fixed by
Decision 28, 1 accepted).

**Failure Modes Registry.**
```
 CODEPATH            | FAILURE MODE          | RESCUED | TEST | USER SEES        | LOGGED
 outcome save        | network error         | Y       | Y    | toast, rollback  | N (client)
 outcome save        | bad lead id           | Y (D28) | Y    | toast            | Y
 stale refetch       | lead reappears        | Y (D30) | Y    | nothing          | N
 terminal pending    | tab killed <5s        | N       | N    | outcome missing  | N  (accepted, visible on next load)
 bulk mutation       | tx fails              | Y       | Y    | toast            | Y
 export              | >50k rows             | Y (D28) | Y    | notice           | Y (D29)
 prod recompute      | wrong row count       | Y       | N    | n/a (admin step) | Y
```
CRITICAL GAPS: 0 (the killed-tab row is user-visible on next load: the lead is
still in Today).

**Stale diagram audit.** `docs/sales-pipeline.md` bucket-rule prose changes
with G3 exceptions 1-2; update in the same change. No ASCII diagrams in the
touched source files.

#### Implementation Tasks (CEO)
- [ ] **T1 (P1, human ~2h / CC ~10min)** — spec — consolidate accepted requirements into the body (Decision 25). Verify: one spec, no "supersedes" bullets.
- [ ] **T2 (P1, human ~4h / CC ~15min)** — sales lib — derived call reset + terminal suppression + tests (Decisions 15-16). Verify: `npm test -- sales`.
- [ ] **T3 (P1, human ~1d / CC ~45min)** — sales lib — outcomes, today-session, today-shortcuts, day-window + tests. Verify: unit tests.
- [ ] **T4 (P1, human ~4h / CC ~20min)** — service — logActivityInTx split, discharge rule, NOT_FOUND, getTodayWork additions. Verify: service tests + typecheck.
- [ ] **T5 (P1, human ~1.5d / CC ~45min)** — Today UI — Up next, queue, progress, undo, copy number, i18n en/ar. Verify: /ui-scan + human checklist.
- [ ] **T6 (P2, human ~1.5d / CC ~45min)** — Pipeline (Part A, ships now per UC1b) — filters.ts, kit table, bulk, export audit. Verify: filters tests + /ui-scan.
- [ ] **T7 (P2, human ~2h / CC ~10min)** — separate PR — CSV guard + limits.ts. Verify: csv.test.ts.
- [ ] **T8 (P1, human ~30min / CC ~5min)** — data — baseline query and post-deploy recompute, each after user confirmation. Verify: counts recorded in docs/sales-pipeline.md.

```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | SELECTIVE EXPANSION                         |
  | System Audit         | sell-first sprint binding decision; pre-existing derived/call bug |
  | Step 0               | 3 cherry-picks accepted, 3 deferred, 1 skipped |
  | Section 1  (Arch)    | 0 new issues (diagrams produced)            |
  | Section 2  (Errors)  | 10 error paths mapped, 3 GAPS (2 fixed, 1 accepted) |
  | Section 3  (Security)| 1 issue (export audit), 0 High              |
  | Section 4  (Data/UX) | 8 edge cases mapped, 0 unhandled (2 fixed)  |
  | Section 5  (Quality) | 1 issue (outcomes as data tables)           |
  | Section 6  (Tests)   | Diagram produced, 1 gap (no admin e2e)      |
  | Section 7  (Perf)    | 0 issues (index to verify)                  |
  | Section 8  (Observ)  | 2 gaps (audit lines) → accepted             |
  | Section 9  (Deploy)  | 1 risk flagged (prod recompute)             |
  | Section 10 (Future)  | Reversibility: 4/5, debt items: 1           |
  | Section 11 (Design)  | 0 issues here; deep review in Phase 2       |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (5 items)                           |
  | What already exists  | written                                     |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 10 rows, 0 CRITICAL GAPS                    |
  | Failure modes        | 7 total, 0 CRITICAL GAPS                    |
  | TODOS.md updates     | 3 items (recorded in docs/sales-pipeline.md, no TODOS.md) |
  | Scope proposals      | 7 proposed, 3 accepted                      |
  | CEO plan             | written                                     |
  | Outside voice        | codex unavailable (not_authed); Claude subagent completed |
  | Lake Score           | N/A (auto-decided, no scored questions asked) |
  | Diagrams produced    | 5 (architecture, state machine, data flow, error, user flow) |
  | Stale diagrams found | 0 (1 prose section to update)               |
  | Unresolved decisions | 0 (UC1 resolved at final gate: both now)    |
  | Reality rows         | 7/7 rows, 0 unverified                      |
  +====================================================================+
```

## Design review (Phase 2)

### Step 0
Initial design completeness: **5/10**. Behaviour (outcome mapping, reducer,
undo, shortcuts) is well specified; visual hierarchy of the Up next card,
loading/error states, and Pipeline chrome are not. A 10 names the order and
emphasis of every element on Up next, every state per surface, the badge token
map and the mobile layout of both pages.
DESIGN.md: none. Calibrating against `.claude/standards/design.md` (one focal
point, ≤4 type sizes, semantic tokens, all states styled) and the global UI
component rules (shadcn `Card`/`Badge`/`Alert`, semantic tokens, logical CSS).
Existing leverage: data-table kit (loading/empty/pagination states), shadcn
`Alert`, `AlertDialog`, `Badge`, `Skeleton`, `Tooltip`, sonner toasts,
`LoadingSwap`, `PipelineCounters`, `QuickLogPopover`.
Mockups: skipped (Decision 32). The designer binary is ready, but its
comparison board is an interactive browser flow, which the project kernel bans
(non-negotiable 7), and autoplan cannot wait for board feedback mid-run.
Offered at the gate.

### Design dual voices
Claude design subagent: completed (INPUT hash 162b5d0a…, matches snapshot).
Codex: unavailable (not_authed). [subagent-only]

```
DESIGN OUTSIDE VOICES — LITMUS SCORECARD:
  Check                                    Claude        Codex  Consensus
  1. Brand unmistakable in first screen?   n/a (admin)   N/A    N/A
  2. One strong visual anchor?             NO (H1)       N/A    N/A
  3. Scannable by headlines only?          partly        N/A    N/A
  4. Each section has one job?             NO (H5 chrome) N/A   N/A
  5. Cards actually necessary?             Up next only  N/A    N/A
  6. Motion improves hierarchy?            NOT SPEC'D    N/A    N/A
  7. Premium without decorative shadows?   yes           N/A    N/A
  Hard rejections triggered:               risk of #7 (stacked cards) N/A N/A
```

### Passes
Classifier: **OPERATE** (app UI) for both pages.

| Pass | Before | After | Issues and dispositions |
|---|---|---|---|
| 1 Information architecture | 5 | 8 | H1 card order (accepted), H3 pinned Up next (accepted), H4 progress headline (accepted), H5 chip merge (accepted, Part A) |
| 2 Interaction states | 4 | 8 | S1 states tables (accepted), S2 bulk confirm (accepted), S3 undo edge cases (accepted), S4 picker (accepted), S5 empty precedence (accepted) |
| 3 Journey | 6 | 8 | H2 outcome emphasis (taste), J1 channel switch (taste), J2 promote returns slot (accepted), J3 recap + `demosBookedToday` (accepted), J4 bulk safety (covered by S2) |
| 4 AI slop | 6 | 8 | Hard rejection #7 risk (stacked cards): queue becomes a list, only Up next is a surface (accepted); motion specified (SP8) |
| 5 Design system | 5 | 8 | No DESIGN.md (gap, see NOT in scope); SP1 badge token map (taste); variants named per element |
| 6 Responsive & a11y | 5 | 8 | SP2 overdue not colour-only, SP3 Pipeline mobile scroll + pinned name, SP4 disabled reasons, SP5 kbd hints on touch, SP6 `C` per pointer (taste), SP7 outcome grid |
| 7 Unresolved decisions | — | — | Up next card visual style beyond token choices needs a human look (mockups skipped); everything else decided |

Journey storyboard:
```
 STEP | USER DOES                         | USER FEELS        | PLAN SPECIFIES
 1    | opens /sales/today                | "where do I start" | Up next card, one default button
 2    | reads why-now + opening angle     | prepared          | reason + angle under the name
 3    | taps Call (phone) / C (copies)    | committed         | outcome row promoted, focus moves
 4    | taps outcome                      | quick relief      | toast, crossfade to next lead
 5    | mis-taps Not interested           | worry             | 5 s Undo toast restores the lead
 6    | finishes the list                 | done, proud       | All done + recap + due tomorrow
```

### NOT in scope (design)
- A project DESIGN.md / design system document (recommend `/design-consultation` later; this change uses shadcn tokens and the existing standard).
- Visual mockups (Decision 32; offered at the gate).

### What already exists (design)
data-table kit states and pinning; shadcn `Alert`, `AlertDialog`, `Badge`,
`Skeleton`, `Tooltip`; sonner toasts; `LoadingSwap`; `PipelineCounters`
(merged into chips in Part A); `QuickLogPopover` (kept behind More details).

#### Implementation Tasks (Design)
- [ ] **D1 (P1, human ~3h / CC ~15min)** — Today — build Up next card with the specified order, single default button, channel switch, muted-then-promoted outcome row. Verify: /ui-scan + checklist.
- [ ] **D2 (P1, human ~3h / CC ~15min)** — Today/Pipeline — loading, error, empty-precedence states per the states table. Verify: checklist rows per state.
- [ ] **D3 (P1, human ~2h / CC ~10min)** — session reducer — pinned Up next, promote-returns-slot, undo flush on route change/unmount, stacked toasts. Verify: `lib/today-session.test.ts`.
- [ ] **D4 (P2, human ~2h / CC ~10min)** — Pipeline — chip row with counts, bulk confirm dialog, badge token map, overdue icon+text, mobile horizontal scroll. Verify: /ui-scan + checklist.
- [ ] **D5 (P2, human ~1h / CC ~5min)** — a11y — disabled reasons inline + aria, kbd hints hidden on coarse pointers, reduced-motion crossfade. Verify: /ui-scan.

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | no DESIGN.md; UI scope: 2 pages             |
  | Step 0               | 5/10, all 7 dimensions (autoplan)           |
  | Pass 1  (Info Arch)  | 5/10 → 8/10 after fixes                     |
  | Pass 2  (States)     | 4/10 → 8/10 after fixes                     |
  | Pass 3  (Journey)    | 6/10 → 8/10 after fixes                     |
  | Pass 4  (AI Slop)    | 6/10 → 8/10 after fixes                     |
  | Pass 5  (Design Sys) | 5/10 → 8/10 after fixes                     |
  | Pass 6  (Responsive) | 5/10 → 8/10 after fixes                     |
  | Pass 7  (Decisions)  | 20 resolved, 1 deferred (visual look)       |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (2 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 0 (DESIGN.md recommendation only)           |
  | Approved Mockups     | 0 generated, 0 approved (skipped, D32)      |
  | Decisions made       | 20 added to plan                            |
  | Decisions deferred   | 1 (visual look without mockups)             |
  | Overall design score | 4/10 → 8/10                                 |
  +====================================================================+
```

## DX review (Phase 2.5)

Mode: DX POLISH (autoplan override). Product type: internal API/Service
(tRPC procedures + `server/service.ts`, the surface a future MCP sales tool
calls; router.ts:22-23). Search: not run (no Aside/WebSearch); in-distribution
benchmarks only.

```
TARGET DEVELOPER PERSONA
========================
Who:       an AI coding agent (or contributor) implementing this plan or
           calling the sales service from an MCP tool
Context:   picks up docs/designs/sales-workspace-redesign.md cold
Tolerance: reads errors literally, cannot ask, retries blindly
Expects:   one spec, named constants, typed errors, runnable test commands
```

**Empathy narrative.** I open the design doc and find a clean Part A / Part B
spec, then about 60 appended bullets that override it ("supersedes earlier
prose"). I have to diff them in my head before writing a line. I need to
recompute derived columns on production, but `package.json` has only `seed`,
so I would write an ad-hoc script against a `.env` that points at live Neon.
When a save fails I get a bare `NOT_FOUND` with no lead id. After the fixes:
one spec with a PR order and gate commands, a guarded `sales:recompute
--dry-run`, typed `SalesError` app codes, and docs tables built from the same
mapper the code uses.

**Competitive benchmark (estimated, no live research).** Close and HubSpot
APIs ship typed error codes and idempotent writes; internal tools usually lack
both. TTHW for the implementer (spec → first green test): ~30 min estimated
today (merging amendments, finding commands); target < 10 min after
consolidation. Tier: Needs Work → Competitive.

**Magical moment.** `npx vitest run src/features/system/sales` passes and the
outcome table in the docs matches `lib/outcomes.ts` exactly, because both come
from one mapper. Vehicle: the existing Vitest setup (DX POLISH, no new tooling).

```
DX DUAL VOICES — CONSENSUS TABLE:
  Dimension                           Claude            Codex  Consensus
  1. Getting started < 5 min?          no (spec merge)   N/A    N/A
  2. API/CLI naming guessable?         mostly            N/A    N/A
  3. Error messages actionable?        no (2 CAP4)       N/A    N/A
  4. Docs findable & complete?         partly            N/A    N/A
  5. Upgrade path safe?                yes (internal)    N/A    N/A
  6. Dev environment friction-free?    no (prod .env)    N/A    N/A
```
Claude DX subagent: completed (INPUT 5eaef272…, matches snapshot). Codex: unavailable.

Developer journey map:
```
STAGE           | DEVELOPER DOES                     | FRICTION               | STATUS
1. Discover     | opens the design doc               | amendments vs body     | fixed (consolidate, D39)
2. Install      | npm install, .env                  | .env = prod Neon       | fixed (guarded scripts, D41)
3. Hello World  | runs sales vitest                  | no command named       | fixed (gate commands, D39)
4. Real Usage   | calls logActivity / bulkSetStatus  | overlap, magic numbers | fixed (D42)
5. Debug        | hits a failed save / bulk          | bare NOT_FOUND         | fixed (SalesError, D43)
6. Upgrade      | listPipeline input shape changes   | internal, one caller   | ok
```

First-time developer report: T+0:00 opens the plan; T+0:05 realises the
bullets override the body; T+0:20 searches for a recompute command and finds
none; T+0:30 writes an ad-hoc script against the prod `.env` (the risk D41
removes).

| Pass | Before | After | Notes |
|---|---|---|---|
| 1 Getting started | 4 | 8 | consolidation, PR order, commands |
| 2 API design | 7 | 8 | single bulk mutation, constants, truncated flag, summary type |
| 3 Errors (agent-ready-v1) | 4 (CAP4 x2) | 8 | durable writes, guarded scripts, app codes, correlation ids |
| 4 Docs | 5 | 8 | matrix/outcome/shortcut tables from one mapper, Errors section |
| 5 Upgrade path | 7 | 8 | listPipeline input change has one caller; noted for PR3 |
| 6 Dev environment | 5 | 8 | prod-safe scripts with dry-run; port 3001 note |
| 7 Community | N/A | N/A | internal admin tool, no external community |
| 8 Measurement | 6 | 8 | baseline SQL + two-week re-read (CEO D24) |

```
+====================================================================+
|              DX PLAN REVIEW — SCORECARD                             |
+====================================================================+
| Getting Started      | 8/10 (from 4)                                |
| API/CLI/SDK          | 8/10 (from 7)                                |
| Error Messages       | 8/10 (from 4; CAP4 cleared by D40/D41)       |
| Documentation        | 8/10 (from 5)                                |
| Upgrade Path         | 8/10 (from 7)                                |
| Dev Environment      | 8/10 (from 5)                                |
| Community            | N/A (internal tool)                          |
| DX Measurement       | 8/10 (from 6)                                |
| TTHW                 | ~30 min est. → <10 min target                |
| Competitive Rank     | Needs Work → Competitive                     |
| Magical Moment       | designed via shared outcome mapper + vitest  |
| Product Type         | API/Service (internal)                       |
| Mode                 | POLISH                                       |
| Overall DX           | 8/10 (from 4)                                |
+====================================================================+
```

DX implementation checklist
- [ ] Spec consolidated with the PR0-PR3 table before handoff
- [ ] `npx vitest run src/features/system/sales` green per PR
- [ ] `npm run sales:recompute -- --dry-run` works against a non-prod DB
- [ ] Every new failure throws `SalesError` with an `appCode` listed in docs
- [ ] Pending terminal writes reconcile on reload
- [ ] Docs tables generated from / tested against `lib/outcomes.ts`
- [ ] `BULK_ACTION_LIMIT`, `EXPORT_ROW_LIMIT`, `UNDO_WINDOW_MS` named

NOT in scope (DX): public or versioned API, SDK, community channels (internal tool).
What already exists: Vitest (`npm run test:unit`), the seed CLI, the router's
audit `console.info` pattern, `EXPORT_ROW_LIMIT` in users filters.

#### Implementation Tasks (DX)
- [ ] **X1 (P1, human ~2h / CC ~10min)** — docs — consolidate spec with PR table and gate commands. Verify: single spec.
- [ ] **X2 (P1, human ~3h / CC ~15min)** — today-session — sessionStorage mirror, keepalive flush, reconcile on load. Verify: `lib/today-session.test.ts`.
- [ ] **X3 (P1, human ~3h / CC ~15min)** — scripts — `sales:recompute` with dry-run/yes + baseline SQL. Verify: dry-run on a non-prod DB.
- [ ] **X4 (P2, human ~2h / CC ~10min)** — service/router — `SalesError` app codes, correlation ids, Errors doc. Verify: service tests.
- [ ] **X5 (P2, human ~1h / CC ~5min)** — API — single `bulkSetStatus`, limit constants, `truncated`, `TodayWorkSummary`. Verify: typecheck.

## Eng review (Phase 3)

### Scope Challenge
Target: this plan. Existing code read: `sales/server/service.ts`, `router.ts`,
`recompute.ts`, `schemas.ts`, `settings.ts`, `lib/today-rules.ts`,
`lib/derived.ts`, `admin/*`, `users/server/filters.ts`, `core/data-table/*`,
lead and lead-activity schemas. History: sales module created in bf24f6b,
Meetings integration in 0b27941/cbbd531/c82f71d; no reverts.
Complexity: ~30 changed/new files across 4 PRs (estimate), 0 new services
(pure modules + one CLI). Gate tripped (8+ files). Structure question
auto-decided to the **original arrangement** (PR0-PR3 already split by
module; no smaller arrangement keeps the accepted scope). Feature cuts: none
auto-taken (P2 "never reduce"); Part A timing remains UC1.
Result: **scope accepted as-is**. Search: unavailable, in-distribution only.

Existing-code findings worth naming:
- `getSalesSettings().newQueueCap` exists (`server/settings.ts:17`) but
  `getTodayWork` never reads it (router passes only `input.newQueueCap`,
  `router.ts:40`), so the sprint's configured cap is ignored today. Fixed by
  the accepted settings-read requirement.
- `Executor` is module-private (`server/recompute.ts:18`); export is planned.
- `lead_activities` indexes: `(lead_id, occurred_at)`, `type`, `next_action_at`
  (`lead-activities-table.ts:83-88`); no `occurred_at`-leading index.

REALITY: premise-table pass 9 premises from CEO 0A re-checked plus 3 eng premises, unverified=0 src/features/system/sales/server/settings.ts:17
REALITY: already-done pass no sales commits after bf24f6b/c82f71d touch these paths 4e4f654
REALITY: surface-check finding npm run sales:recompute does not exist yet (planned); test:unit and typecheck scripts exist package.json:28
REALITY: binding-decisions finding sell-first zero-code sprint (UC1) and CEO D20 undo mechanism superseded by D46 c956ef0
REALITY: numbers pass caps re-derived: newQueueCap 10 [measured: today-rules.ts:104], follow-up limit 2 [measured: today-rules.ts:103], users export 50k [measured: users/server/filters.ts:25], sales export 5k [estimated], bulk 100 [estimated] src/features/system/sales/lib/today-rules.ts:100
REALITY: deferred-asks pass no linked issue for this request docs/sales-pipeline.md:149
REALITY: pr-count finding four PRs (PR0 CSV, PR1 refactor, PR2 Today, PR3 Pipeline) instead of default one; each extra PR costs one review/CI cycle, accepted for independent shipping src/features/core/data-table/lib/csv.ts:3

### Eng dual voices
Claude eng subagent: completed (INPUT 783c1d8a…, matches snapshot). Codex: unavailable.
```
ENG DUAL VOICES — CONSENSUS TABLE:
  Dimension                           Claude                 Codex  Consensus
  1. Architecture sound?               yes                    N/A    N/A
  2. Test coverage sufficient?         gaps (H1, DST, e2e)    N/A    N/A
  3. Performance risks addressed?      partly (M3, H2, M4)    N/A    N/A
  4. Security threats covered?         yes + L5               N/A    N/A
  5. Error paths handled?              H3 gap                 N/A    N/A
  6. Deployment risk manageable?       yes (M5 dry-run delta) N/A    N/A
```

### 1. Architecture
```
  PR0 core/data-table/lib/{csv,limits}.ts ──────────────┐ (users + sales import limits)
  PR1 sales/lib/derived.ts  sales/lib/today-rules.ts     │
        │                       │                        │
        ▼                       ▼                        │
  sales/server/recompute.ts (Executor) ◄── scripts/sales-recompute (CLI, --dry-run/--yes)
        ▲
  sales/server/service.ts: logActivityInTx ─ lock+check ─ discharge ─ insert ─ status ─ recompute
        ▲          getTodayWork (+settings, +1 grouped aggregate)   listPipeline/exportRows (PR3)
        │                       ▲                                    ▲
  sales/server/router.ts (assertAdmin, SalesError→TRPCError, Inngest demo trigger)
        ▲                       ▲                                    ▲
  PR2 admin/today-page ── useTodaySession ── lib/{outcomes,today-session,today-shortcuts,day-window}
  PR3 admin/leads-table-page ── data-table kit ── pipeline-{columns,filters,row-actions,bulk-actions}
```
Coupling added: Today page now depends on settings via `getTodayWork` (fine).
Production failure per path: Neon cold start during bulk (statement timeout,
"Nothing changed"); Inngest down on Book demo (existing "Room pending");
export size (capped at 5k). Findings: H1, H3 (resolved D45, D47).
Dispositions: accepted.

### 2. Code quality
- [P1] (confidence 9/10) `service.ts:99-104` — status update is prospect-scoped
  but the insert above it is not; a non-prospect id inserts an activity
  silently. → D47 accepted.
- [P2] (confidence 8/10) Deferred-write design duplicates tRPC wire handling
  (keepalive) and reconciles by fuzzy time → D46 compensating undo.
- [P2] (confidence 7/10) `lib/outcomes.ts` branching across bucket × channel ×
  phone × whatsapp: implement as data tables (CEO S5) to stay under 5 branches.
- Shared code: `EXPORT_ROW_LIMIT` moves to `core/data-table/lib/limits.ts`;
  callers verified: `users/server/filters.ts:25` (existing), sales export
  (proposed). Net: ~+5 / -1 lines; justified by one source for limits.
Dispositions: accepted.

### 3. Test review
Framework: Vitest (`npm run test:unit`, `package.json:30`), Playwright
(`npm test`). Existing sales tests: `lib/today-rules.test.ts`,
`server/meeting.test.ts`.
```
CODE PATHS                                              USER FLOWS
[+] lib/derived.ts computeDerived                       [+] Today session
  ├── [GAP] answered call / demo_* reset count            ├── [GAP] outcome → advance → refetch (reducer)
  └── [GAP] no_answer counts toward limit                 ├── [GAP] Call back today reappears at 17:00 (H1)
[+] lib/today-rules.ts                                    ├── [GAP] terminal → Undo → restored (D46)
  ├── [★★★ TESTED] buckets/boundaries today-rules.test.ts ├── [GAP] pinned lead vanishes → unpin
  └── [GAP] terminal statuses suppressed                  ├── [GAP] skip all → Start over
[+] lib/outcomes.ts                                       └── [GAP][→E2E] full log/advance/refetch (deferred D54)
  ├── [GAP] every outcome → valid logActivityInputSchema [+] Pipeline
  └── [GAP] bucket × whatsapp × phone primary action      ├── [GAP] filters/sort/default sort (filters.test)
[+] lib/day-window.ts                                     ├── [GAP] bulk lost on 100 ids, timing
  └── [GAP] midnight, DST spring/fall, presets past       └── [GAP] export at 5k cap, size < 4 MB
[+] lib/today-shortcuts.ts                              [+] Error states
  └── [GAP] codes, Arabic layout, numpad, disabled        ├── [GAP] SALES_LEAD_NOT_PROSPECT (no status)
[+] service.logActivityInTx                               ├── [GAP] SALES_DO_NOT_CONTACT outbound
  ├── [GAP] lock+check NOT_FOUND                          └── [GAP] network failure → rollback toast
  ├── [GAP] discharge: contact | terminal | neither
  └── [GAP] compensating undo restores nextActionAt
[+] service.getTodayWork aggregates
  └── [GAP] newTouchedToday excludes yesterday-first leads
[+] core/data-table/lib/csv.ts
  └── [GAP] phone kept, formula prefixed, round trip
[+] scripts sales-recompute
  └── [GAP] dry-run per-bucket delta, refuses without --yes
COVERAGE: 1/27 paths tested today (all new code)  |  GAPS: 26 (1 E2E deferred)
```
All gaps become required tests in the plan (each tied to an accepted
requirement); the admin Playwright fixture + one Today flow e2e is deferred
(D54). Value cards are in the test plan artifact.

### 4. Performance
- [P2] (confidence 8/10) `getTodayWork` adds four aggregates over
  `lead_activities` filtered by `occurred_at` with no leading index → one
  grouped query (D50). Scale: ~100s of rows today [estimated]; seq scan fine;
  `(occurred_at)` index noted as a follow-up.
- [P2] (confidence 7/10) bulk 100 × (lock, discharge, insert, status,
  recompute re-reading all activities) ≈ 500+ statements → timeout + measure (D51).
- [P1] (confidence 8/10) export JSON size → 5k cap (D48).
- Global search `ilike '%..%'` on 7 columns: no index use; fine at this scale;
  `pg_trgm` later.

### Failure modes
```
 CODEPATH                 | FAILURE                         | TEST | HANDLED | USER SEES
 logActivityInTx          | non-prospect id                 | Y    | Y (D47) | "Lead not found" toast
 logActivityInTx          | do-not-contact outbound         | Y    | Y (D47) | inline error
 today refetch            | stale pre-write response        | Y    | Y (D45) | nothing (lead stays hidden)
 today refetch            | callback due again same day     | Y    | Y (D45) | lead reappears
 undo                     | compensating write fails        | Y    | Y       | error toast, lead stays logged
 bulkSetStatus            | Neon timeout                    | Y    | Y (D51) | "Nothing changed" + correlation id
 exportRows               | over cap                        | Y    | Y (D48) | truncation notice + filename
 day-window               | DST transition                  | Y    | Y (D49) | correct preset times
 sales-recompute          | run against prod by mistake     | Y    | Y       | refuses without --yes, prints host
```
Critical gaps: 0.

### Worktree parallelization
| Step | Modules touched | Depends on |
|---|---|---|
| PR0 CSV + limits | core/data-table | — |
| PR1 refactor + derived + CLI | sales/server, sales/lib, scripts | — |
| PR2 Today | sales/admin, sales/lib, translations | PR1 |
| PR3 Pipeline | sales/admin, sales/server, translations | PR0, PR1 |

Lane A: PR0 (independent). Lane B: PR1 → PR2 → PR3 (shared sales modules).
Launch A + B together; merge PR0 before PR3. Conflict flag: PR2 and PR3 both
edit translations and `sales/server` — sequence them.

### NOT in scope (eng)
- Streaming CSV route handler (5k cap suffices for ~100 prospects).
- `occurred_at` index and `pg_trgm` search index (future /migration).
- Admin Playwright fixture and Today-flow e2e (D54, TODO).
- Users export size risk at 50k (TODO).

### What already exists (eng)
Reused: data-table kit, users filter/sort whitelist pattern, `recomputeLeadDerived`,
`logActivityInputSchema` refine, router Inngest trigger, `@date-fns/tz` (already a
dependency, used in `lib/calling-window.ts`), Vitest config.

### TODOs collected from all phases (no TODOS.md in repo; written to `docs/sales-pipeline.md` "Not built (by design)" in PR1)
- WhatsApp templates per bucket (CEO, deferred by sprint) — P3.
- Kanban board view (CEO) — P3.
- Sprint/track metrics widget (CEO) — P3.
- Project DESIGN.md via /design-consultation (Design) — P3.
- Generated mockups review once allowed (Design D32) — P3.
- Admin Playwright fixture + Today flow e2e (Eng D54) — P2.
- `occurred_at` index, `pg_trgm` search (Eng) — P3.
- Users export 50k size risk (Eng H2) — P2.

#### Implementation Tasks (Eng)
- [ ] **E1 (P1, human ~2h / CC ~10min)** — service — lock+check prospect, do-not-contact guard, discharge order. Verify: service tests on branch DB.
- [ ] **E2 (P1, human ~3h / CC ~15min)** — today-session — time-scoped refetch guard, compensating undo, unpin vanished lead. Verify: `lib/today-session.test.ts`.
- [ ] **E3 (P1, human ~2h / CC ~10min)** — day-window — `@date-fns/tz` + DST tests. Verify: `lib/day-window.test.ts`.
- [ ] **E4 (P2, human ~2h / CC ~10min)** — getTodayWork — single grouped aggregate, newTouchedToday via min. Verify: service test.
- [ ] **E5 (P2, human ~1h / CC ~5min)** — export — 5k sales cap, size test. Verify: export test.
- [ ] **E6 (P2, human ~1h / CC ~5min)** — bulk — statement timeout, timing measurement. Verify: bulk test.
- [ ] **E7 (P2, human ~1h / CC ~5min)** — derived + CLI — demo types reset, per-bucket dry-run delta. Verify: derived tests + dry-run output.

Eng completion summary: Scope accepted as-is; reality rows 7/7, 0 unverified;
Architecture 2 issues; Code quality 3; Test review diagram produced, 26 gaps
(all required, 1 deferred); Performance 3; failure modes 0 critical gaps;
outside voice Codex unavailable, Claude subagent completed; parallelization
2 lanes (1 parallel, 1 sequential); Lake Score N/A (auto-decided).
