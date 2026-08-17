# ADR-0002: Sales pipeline shares the `leads` table

- **Date:** 2026-08-17
- **Status:** accepted

## Context

Outbound prospecting for the atelier vertical ran out of spreadsheets
(`Call_Sheet_*.xlsx`). The problem was never storage — it was *deciding who to
contact today*. A hand-maintained call list goes stale within a day, follow-up
promises get dropped, and chasing past two unanswered WhatsApp messages risks a
ban on the business number. The module that replaces it therefore computes its
work list from pipeline state rather than storing one.

A `leads` table already existed, written by the public contact form and read by
the `/leads` screen. The new module needed a prospect record with ~20 additional
fields, an 11-state pipeline, and an append-only activity log. The open question
was whether outbound prospects belong in that table or in their own.

## Decision

We will **extend the existing `leads` table** with a `kind` discriminator
(`inbound` | `prospect`) rather than create a separate prospects table, and add
one new child table `lead_activities`.

Containment measures that make the sharing safe:

- **Separate status columns.** `status` (`lead_status`) keeps the contact-form
  vocabulary; a new `pipelineStatus` (`lead_pipeline_status`) holds the outbound
  one. The two vocabularies do not overlap — `qualified`/`closed` mean nothing in
  outbound, and `awaiting_reply`/`parked` mean nothing to the contact form.
- **Every pre-existing read is scoped to `kind = 'inbound'`**: the `/leads`
  router (list, updateStatus, delete, myLeads), all three dashboard lead
  figures, and the lead-submitted Inngest function. Without this the 44
  prospects would have appeared in the contact-form inbox and inflated the
  dashboard.
- `email` and `message` became nullable, since prospects have neither. The
  contact-form Zod schema still requires both at the boundary.

Derived values (`lastContactedAt`, `followUpCount`, `nextActionAt`) are cached
columns on `leads`, recomputed from `lead_activities` by
`recomputeLeadDerived()` after every append and never written by callers.

## Alternatives considered

- **Separate `prospects` / `prospect_activities` tables.** Zero ambiguity, no
  risk to the working contact-form flow, and no nullable-column relaxation.
  Rejected by the product owner in favour of one place to look for anything
  lead-shaped. This remains the cleaner option if the two record types diverge
  further.
- **Extending the existing `lead_status` enum to 11 values.** Rejected: it mixes
  two vocabularies in one column, leaves `qualified`/`closed` as dead values for
  prospects, and requires `ALTER TYPE … ADD VALUE`, which carries
  transaction-block caveats. A second column costs one column and de-risks the
  existing screen entirely.
- **Renaming the contact-form `leads` → `inquiries`** to free the name.
  Cleanest long-term naming, rejected as too much churn in unrelated working
  code for this change.

## Consequences

- `leads` now means two things. Any new query against it **must** declare a
  `kind` scope; forgetting to is the failure mode this ADR creates. The two
  service layers each apply their scope in one place (`prospectScope` in
  `features/system/sales/server/service.ts`, an explicit condition in
  `features/system/leads/server/router.ts`).
- A `lead_scores` table is anticipated for AI scoring but deliberately not
  created — the FK target is stable either way.
- All lead and activity operations live in a server-side service layer with
  typed Zod inputs (`features/system/sales/server/`), so the planned MCP wrapper
  calls the same functions the UI calls rather than reimplementing the rules.
  Route handlers and components contain no business logic.
- The bucket rules live in one pure, DB-free module
  (`features/system/sales/lib/today-rules.ts`) with `now` injected, because the
  thresholds are expected to be tuned and must be testable at their boundaries.
