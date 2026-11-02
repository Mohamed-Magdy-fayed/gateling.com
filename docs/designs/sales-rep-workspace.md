# Sales operator workspace: funnel stage on every lead

Status: Phase 1 BUILT (2026-11-01). Phase 2 superseded 2026-11-03: the dashboard now shows the **yes funnel** (seven yeses ticked per lead), see `docs/sales-pipeline.md` → The yeses / Dashboard
Owner: Mohamed
Tier: **M**. Branch flow is `feat/<slug>` → `preview` → `main`.
Funnel source: the "Gateling Atelier System – Sales Funnel" doc (7 stages).
Related: `docs/sales-pipeline.md`, ADR-0002

## Rules for this work

- **No database changes.** No new statuses, columns or tables. Everything is
  derived from the existing `pipelineStatus`, the activity log, and outcome
  text conventions.
- No templates, no pricing calculator, no catalog, no walkthrough, no playbook
  page, no Atelier app changes.
- Everyone works the same Today list (10 new ateliers a day for the whole system).

## The funnel, mapped onto what exists

The doc has 7 stages. **2. Proof ready** belongs to the company, not to a lead:
it's the case study page with the price, Aalaa's testimonial and the 60-second
video. That is content work on `/work/<slug>`, not part of this build. **7.
Referral** is a step inside Paying. That leaves 5 lead stages plus Closed.

A new **outcome-text convention** (the same idea as the existing `DEPOSIT`
note): when the operator sends the video and case-study link, she logs it with
the new outcome button **"Sent video + case study"**. That saves a `whatsapp_sent`
activity whose `outcome` starts with `VIDEO`. This is how the system tells
Discovery apart from Outreach without a schema change.

| Funnel stage | Derived from | Line shown (what now → what next) |
|---|---|---|
| 1. Discovery | `new` | Start a discovery chat. Ask how she manages bookings, deposits and returns. Don't pitch. → Next: write down her exact words. |
| 1. Discovery | `awaiting_reply`, no `VIDEO` yet, no conversation yet | Discovery message sent, waiting for a reply. One follow-up after 3 days, then park. → Next: she replies. |
| 1. Discovery | `contacted` / `callback_scheduled`, no `VIDEO` yet | She talked about her problem. Put her exact words in the notes. → Next: send the video and Aalaa's case-study link. |
| 3. Outreach | `awaiting_reply`, `VIDEO` sent | Video sent. If there's no reply in 3 days, send one follow-up, then stop. → Next: a demo. |
| 3. Outreach | `contacted` / `callback_scheduled`, `VIDEO` sent | She replied after the video. → Next: offer a demo of **her** problem only. |
| 4. Demo | `demo_agreed` | She agreed to a demo. → Next: fix the day and time and book it. |
| 4. Demo | `demo_scheduled` | Demo on {date} at {time}, on meetings.gateling.com. Show only her problem. → Next: offer the free setup and the trial. |
| 5. Trial | `demo_done` | Free setup and data entry, 1-month trial. Check in during week 1 and week 4 (from {demo date}). → Next: ask her to subscribe on day 30. |
| 6. Paying | `won` | Paying client. → Next: ask for a referral after a month or two. |
| 6. Paying → 7. Referral | `won`, 14+ days since won | Ask for the names of other owners she knows. |
| Closed | `lost`, `parked`, `blocked_no_number` | Closed, nothing to do. |

"Conversation" uses the existing `lib/derived.ts` meaning: `whatsapp_reply`,
an answered `call`, `demo_agreed`, `demo_scheduled` or `demo_done`. Trial week 1
and week 4 are counted from the latest `demo_done`. "Won date" is the latest
activity that set `won`. If it can't be found, the referral line shows straight away.

Implementation: pure `lib/funnel.ts` →
`funnelStageFor(lead, activitySummary, now)` returns `{ stage, nowLine, nextLine }`.
The wording lives in `sales-en.ts` / `sales-ar.ts`. Unit tests cover every
row, with `now` injected and Cairo days.

## Phase 1: operator access, stage line, thin Today cards

1. **Operator = employee.** Remove `"sales"` from `EMPLOYEE_BLOCKED_SCREENS`. In
   the sales router, change `assertAdmin` to admin-or-employee. Export, bulk
   actions and API-key management stay admin-only. `dashboard.getSales` opens to
   employees. Extend `e2e/sales-access.spec.ts` to cover this. Security review (auth).
2. **Stage line on the lead page.** Show the stage chip and the now → next line
   under the `ClientHero` header. Add the outcome button "Sent video + case
   study" to the WhatsApp outcome set (`lib/outcomes.ts`). Add the same outcome
   to the sales MCP `log_outcome`.
3. **Today = thin cards that link to the lead.** Each card holds: name, number,
   follower count with its top platform icon (Instagram / Facebook / TikTok),
   and the stage line. Tapping it opens `/sales/leads/[id]`. The Up next panel,
   inline outcome buttons and keyboard shortcuts come off Today, because the
   work happens on the lead page.
4. **Today rules stay as they are; one change.** New queue: 10 a day, shared.
   Overdue: a scheduled follow-up or call-back that is due. Follow-up due: no
   reply 3 days after the last message, at most one follow-up. Auto-park: the
   follow-up went unanswered. The change: **any** activity logged today, notes
   included, removes the lead from today's list. When you come back from the
   lead page, Today refetches. The lead then **comes back by itself on the
   right day**: the day of its next-action date if one was set (call-back,
   follow-up, demo), otherwise the day the rules make it due (for example, 3
   days after an unanswered message). Nobody moves it by hand. Run
   `npm run sales:recompute -- --dry-run` before shipping.

## Phase 2: funnel on the dashboard (no DB changes)

A **"Funnel this week"** card drawn as the doc's stages, with counts of
distinct leads from activities whose `occurredAt` falls in the week (Cairo),
plus the previous 7 weeks for comparison:

| Step | Counted from |
|---|---|
| Messages sent | first outbound (`whatsapp_sent`, `call`, `no_answer`) |
| Replied (discovery) | `whatsapp_reply` or an answered `call` |
| Video sent | `whatsapp_sent` whose outcome starts with `VIDEO` |
| Demo booked | `demo_scheduled` |
| Trial (demo held) | `demo_done` |
| Paying | `note` whose outcome starts with `DEPOSIT` (existing convention) |

It shows the % between each step and **highlights the biggest drop**, with the
doc's own advice: low replies → fix the message; demos that don't turn into
trials → fix the demo; trials that don't pay → fix the offer. It also shows
progress toward 5 paying in 60 days (setting `00021` = start). The Friday
weekly-tracker table in the doc then fills itself.

## Done when

- An employee created on the Users screen can work Today and the lead pages.
- Every lead page and Today card shows its funnel stage and next step (EN + AR).
- Today cards are thin links to the lead, and a logged lead drops off Today.
- The dashboard shows the weekly funnel with the weakest step highlighted.
- Typecheck, build, `test:unit` and the sales e2e (port 3001) pass,
  `/ui-scan` is clean, and `docs/sales-pipeline.md` is updated.
