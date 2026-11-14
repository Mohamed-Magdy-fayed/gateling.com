# Discovery module («الاستكشاف»)

Status: **v1 built 2026-11-12** on `feat/discovery` (approved scope: quick form, Android link sharing, Discovery MCP). Tier **L**.
Decisions: phone is Android (Web Share Target works; no iOS Shortcut needed); Arabic name «الاستكشاف».

Where things live: schema `src/drizzle/schemas/discovery/` (migration `0028_discovery`), logic `src/features/system/discovery/` (`lib/readout.ts` is the verdict rule, unit-tested), screens `/discovery`, `/discovery/log`, `/discovery/studies/[id]`, `/discovery/contacts/[id]`, `/discovery/templates`, MCP `/api/mcp/discovery` (guide: `docs/discovery-mcp.md`, API-key scope `discovery`), share target `src/app/manifest.ts`.

The plan below is kept as written; differences from it are noted inline.

Discovery is a separate process from Sales. Sales sells a product to a pipeline.
Discovery records whether the problem is real and whether people will pay
(the 6-step method in `gateling-doctor/docs/jarvis-skill/jarvis/references/saas-validation.md`,
first study from `gateling-doctor/docs/dress-rental-validation-kit.md`).
It never changes a sales lead. A discovery contact can *link* to a lead (read-only badge, one FK).

---

## 1. Data model (`src/drizzle/schemas/discovery/`)

All tables prefixed `discovery_`. Generated migration only.

| Table | Purpose | Key columns |
|---|---|---|
| `discovery_studies` | One niche plus one problem | `title`, `niche`, `problemStatement`, `step` (enum below), `status` (`active` / `go` / `fix_pitch` / `killed` / `archived`), `targetConversations` (default 10), `goMinCommitments` (3), `killMinStories` (3), `priceQuoted` (text, so the first 10 calls use one price), `decisionNote` |
| `discovery_hypotheses` | H1–H5 | `studyId`, `code` ("H1"), `statement`, `passRule` (human text), `passThreshold` (int, e.g. 5), `measure` (`supporting_contacts` / `commitments` / `manual`), `verdict` override (`open` / `true` / `false`), `sortOrder` |
| `discovery_contacts` | Who: a person or a business | `kind` (`person` / `business`), `displayName`, `businessName`, `phone`, `city`, `role` (owner / staff / relative / unknown — feeds H5), `leadId` → `leads.id` nullable (the only link to Sales), `notes` |
| `discovery_contact_handles` | One identity per channel | `contactId`, `channel`, `url`, `handle`, `externalId` nullable (Meta PSID / IGSID / WhatsApp number). **Unique (`channel`, `externalId`)** — this is what lets webhooks (e) attach to the right contact later |
| `discovery_templates` | Outreach messages per step | `studyId` nullable (null = reusable), `step`, `title`, `body` (Egyptian Arabic), `active` |
| `discovery_touchpoints` | Every message, call, comment, meeting | `studyId`, `contactId`, `channel`, `format` (`dm` / `comment` / `post` / `call` / `meeting` / `voice_note`), `direction` (`outbound` / `inbound`), `persona` (`personal` / `gateling`), `templateId` nullable, `url` (profile / post / thread), `message`, `occurredAt`, `repliedAt` nullable (reply latency = `repliedAt − occurredAt`), `source` (`manual` / `share` / `paste` / `mcp` / `meta_webhook`), `externalId` + `webhookEventId` nullable, `attachments` jsonb (Firebase screenshot URLs). **Unique (`source`, `externalId`)** for webhook dedupe. `removedAt` / `removedBy` / `removedReason`: soft removal of a row logged by mistake (UI remove action, MCP `remove_touchpoint`); removed rows count nowhere |
| `discovery_evidence` | A tagged snippet | `studyId`, `contactId`, `touchpointId` nullable, `kind` (`incident` / `workaround_tool` / `cost_loss` / `money_commitment` / `compliment` / `other_pain`), `quote` (their exact words, Arabic), `note`, `amountEgp` nullable |
| `discovery_evidence_hypotheses` | Evidence ↔ hypothesis | `evidenceId`, `hypothesisId`, `stance` (`supports` / `contradicts`) |
| `discovery_commitments` | Money signals, kept apart from talk | `studyId`, `contactId`, `type` (`deposit` / `pre_order` / `price_accepted` / `argued_price` / `argued_need`), `amountEgp`, `priceQuoted`, `status` (`promised` / `paid` / `refunded` / `withdrawn`), `note` |

Enums:
- `discovery_step`: `problem → prototype → payment → mvp → measure → distribution`
- `discovery_channel`: `facebook`, `instagram`, `whatsapp`, `phone`, `in_person`, `group_forum`, `linkedin`, `other`

**Why (e) needs no rework later:** a Meta webhook delivery already lands in `webhook_events`.
A later ingest step maps sender ID → `discovery_contact_handles.externalId` (creates the contact if new),
inserts an `inbound` touchpoint with `source = meta_webhook`, `externalId = mid`, `webhookEventId`,
and stamps `repliedAt` on the latest unanswered outbound touchpoint to that contact. No column changes.

## 2. Readout (pure `lib/readout.ts`, unit-tested)

Definitions (shown on screen so the numbers are never a mystery):
- **Conversation** = a contact in the study with a two-way exchange (an outbound with `repliedAt`, an inbound, a call or a meeting).
- **Story** = a contact with at least one `incident` evidence.
- **Commitment** = a contact with a `deposit` / `pre_order` that is `paid`, or `price_accepted` (paid ones counted separately as the strongest).
- **Hypothesis passes** when distinct contacts with `supports` evidence ≥ `passThreshold` (or commitments for `measure = commitments`); manual verdict overrides.

Verdict (from the kit's rule):
- conversations < target → **Collecting (n/10)**, with what's missing.
- **Go**: H1 or H2 passed and commitments ≥ 3.
- **Fix pitch / price**: stories ≥ 3, commitments < 3. Also shows how many argued price vs argued need.
- **Kill**: stories < 3.

Step stays a manual field. The readout suggests the next step ("3 stories logged — ready to show a prototype?") but never moves it.

Reply analytics: reply rate and median reply time per template, per persona, per channel (outbound touchpoints only). This is where "pitching as Gateling gets no replies" becomes a number.

## 3. Screens (`/discovery`, new screen-registry entry, staff only)

| Route | What |
|---|---|
| `/discovery` | Studies list, each with step and verdict chip. Big **Log** button |
| `/discovery/log` | **Quick capture**, mobile-first, RTL. Also the share-target landing page |
| `/discovery/studies/[id]` | Readout: step stepper, verdict card, counters, hypotheses with progress bars, evidence feed (filter by kind / hypothesis), commitments, reply-rate table |
| `/discovery/contacts/[id]` | Timeline of touchpoints and evidence for one person; "tag evidence" from any message; link-to-lead picker |
| `/discovery/templates` | Templates by step with reply rate and count sent |

Quick-capture design (target: under 15 s for a Facebook DM):
1. Study, persona and channel are **remembered** from the last log (localStorage), so normally untouched.
2. Contact: one field. Typing searches name or handle; pasting a profile URL auto-detects the channel and matches an existing handle; no match → "create '…'" inline.
3. Template chips fill the message; or paste the message.
4. Direction toggle (default outbound) and a **"they replied"** toggle with an optional reply text.
5. Save → toast with **"Tag evidence"** (opens a sheet with the reply text; tap a kind, select the quote, tick hypotheses).
6. Unanswered outbound touchpoints show on the contact and in a **"Waiting for reply"** list with a one-tap "replied now" button (that's how reply time gets recorded later).

## 4. Capture options — evaluation, cheapest first

| Option | Cost | Value | Recommendation |
|---|---|---|---|
| (a) Quick-capture form | Core of v1 | High: works on every channel | **v1** |
| (b) Web Share Target | Small: `app/manifest.ts` + `share_target` (GET: `url`, `text`, `title`) → `/discovery/log` pre-filled. Screenshots need POST multipart + service worker + upload | High on **Android Chrome** (share from FB/IG app → Gateling). **iOS Safari does not support Web Share Target**; an iOS Shortcut that opens `/discovery/log?url=…` is the workaround | **v1 for links/text** (Android). Screenshots → v1.1 |
| (c) Paste box | Plain paste + URL/phone detection: small. AI extraction: needs an LLM SDK, key and per-call cost | Medium. AI extraction overlaps with (d), which costs nothing extra | **v1: plain paste** into the message field. AI extraction: skip, use (d) |
| (d) Discovery MCP (`/api/mcp/discovery`, new `discovery` API-key scope) | Medium: copy the sales MCP shape. Tools: `get_discovery_guide`, `list_studies`, `get_readout`, `find_contact`, `upsert_contact`, `log_touchpoint`, `mark_replied`, `add_evidence`, `log_commitment`, `list_templates` | High: drop screenshots in Claude/Jarvis → it logs touchpoints and tags evidence with exact Arabic quotes. Also the way to seed the dress-rental study | **v1, built last** |
| (e) Meta webhooks | Blocked on Business Verification + App Review | High later | **Later.** Data model ready (section 1) |

## 5. Outreach templates

Seeded from the kit (Egyptian Arabic, question-first, never a pitch): opening line, the "second and last" question message, referral ask, the "only if they told a story" demo line, and the payment-test line using the study's `priceQuoted`. Reply rate per template and per persona shown on `/discovery/templates` and the study readout.

## 6. Build order

1. Schema + generated migration (`/migration` workflow), Zod schemas, pure `lib/readout.ts` with tests (TDD).
2. tRPC router + service (staff-only access check like `sales/server/access.ts`).
3. `/ui-scan --plan` → quick-capture page → study readout → contact timeline → templates. `/ui-scan` after. EN + AR keys for every string.
4. Manifest + share target (GET).
5. Discovery MCP + `discovery` scope + `docs/discovery-mcp.md`.
6. Create the dress-rental study with H1–H5 and kit templates through the MCP (no pasting into the UI).
7. Gates: typecheck, build, unit tests, Playwright smoke for quick-capture (on :3001), security review (new MCP scope, user input). Human UX checklist for the phone pass.

## 7. Out of scope for v1

AI extraction inside the app, screenshot upload via share sheet, Meta webhook ingest, automatic step changes, any write to Sales.

## Phone test checklist (human UX pass, Android, Arabic)

1. Install: open gateling.com in Chrome → ⋮ → Add to Home screen / Install. Gateling appears in the share sheet.
2. Facebook app → a shop's page → Share → Gateling. `/discovery/log` opens with the link filled and the channel set to Facebook.
3. Pick the contact (or "Create …"), tap a template, toggle "ردّوا" and paste their reply, Save. Under 15 s. The Save button stays reachable above the bottom tab bar.
4. From the toast, "علّم دليل": choose "موقف محدد حصل قريب", keep the quote, tick H1 "بيأيد", Save.
5. `/discovery` → the study: the conversation and story counters went up, and H1 progress shows 1 of 5.
6. "مستني رد" tab: an unanswered message shows "ردّوا", and tapping it moves it out of the list.
7. Bottom bar shows Dashboard, Today's Work, Discovery. "More" lists real pages (Pipeline, Blog, Work…), and tapping one closes the sheet.
8. Open the sidebar on the phone, tap any page: it closes.
9. Switch to English: layout mirrors and nothing is left in Arabic.
