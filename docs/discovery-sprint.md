# Discovery sprint: dress-rental ateliers

Living status of the problem-validation sprint. Update it in the same change that makes it stale.
Started 2026-11-14. Owner: Mohamed (operator). Claude runs it as manager: plans each day, delegates
build work to separate sessions, logs results, and keeps this file, Jarvis and memory in sync.

## Goal

Reach **10 real owner conversations** in the Discovery study "محلات تأجير الفساتين"
(study `91467c01-653f-4370-862f-8ee99eb5e382`, step `problem`), then take the readout's verdict:
**go** (core pain passed + 3 commitments), **fix_pitch** (3+ stories, too few commitments) or
**kill** (under 3 stories). Build and sell nothing new before the verdict.

A "conversation" counts only when Mohamed talked two-way with the **owner** (or whoever decides).
Staff and gatekeeper calls are not logged as calls (they inflate the count). Remove a wrong row in
the app (study page → remove, with a reason) or with the MCP tool `remove_touchpoint`.

## How we reach owners

- **Channel:** phone from Mohamed's **personal** number. Instagram DMs got 1 reply in 14.
  The 012 business number is not used: some leads already ignored sales WhatsApps from Gateling.
- **Persona:** personal ("أنا محمد"), never "Gateling". Log `persona: personal`.
- **Opener:** a friend's rental atelier. Title line: "أنا اللي ماسك الجانب التقني لأتيليه صاحبي"
  (not "مبرمج"). Say "أتيليه تأجير" only. Naming the niche (soiree) made Kelly's manager say "we're different".
- **If pressed "why?":** the honest version: Mohamed handles the tech side for that atelier and wants
  to learn real problems before widening it. No selling, no names or numbers needed.
- **Re-entry:** leads the sales side already pitched as Gateling get the honest version from the
  first line, not the friend's-atelier story.
- **Price:** only at the very end, after she has told a real story, and only if she asks or
  shows interest. Quoting it mid-call (Lilly's) turns discovery into a pitch.
- **Instagram fallback:** if the phone isn't answered and staff say the owner is on Instagram, DM there.
  Instagram has no prefill; Claude drafts the text to copy.
- **Owner prefers WhatsApp questions:** send one question at a time. Two unanswered = stop.
- **Questions:** the last specific time (dress clash, late return, deposit dispute) and what it
  cost. Never opinions ("would you use an app?"). Script: `docs/discovery-call-script.md`.
- **Gatekeepers:** ask for the owner's name + when she's usually in. Staff never give the owner's
  private number (normal in Egypt). Leave a message, then follow up via a Jarvis reminder.
- **WhatsApp:** at most one message per shop after a no-answer, and never to a lead the sales side
  already sent 2+ unanswered WhatsApps (auto-park).
- **Consent:** ask before recording a call (Egyptian Penal Code art. 309 bis).

## Call timing (being measured)

Hypothesis A: 1–4 PM, when the shop has just opened and is quiet. Hypothesis B: owners are reachable
in the evening. Score = real owner talks ÷ dials per time block.

- Sat 14 Nov, 1–5 PM: 11 shops, 1 owner reached (La Perla). Mostly staff or no answer.
- Sat 14 Nov, 8–10 PM: 3 owners reached (Lilly's, La Novia, Glowy) plus several no-answers.
- Sun 15 Nov, 8 PM+: Yara Style owner reached (20 min); Chantelle staff only.
- **So far the evening wins clearly.** Mon 16 Nov 1:30–2:30 PM retries (Princess, Ranah, Mona's,
  Satsha) are the last afternoon test; after that, default to 8–10 PM.

## Status (2026-11-15)

Updated Sun 15 Nov, ~20:30.

- **Readout:** 8 conversations, of which **7 are real owners** (the Sama staff call still needs
  removing). Stories 1, commitments 0. H1 1 for / 2 against, H2 0/1, H3 0/2, H4 0/2, H5 4/0.
- **Owner talks so far:** Asma Sleem (IG), Madame Minna / La Perla, Lilly's (engineer, name not
  yet known), Ms Manal / La Novia, Glowy, Ms Yara / Yara Style. (Plus one more in the app.)
- **What owners are actually saying:**
  - **Double bookings are mostly not the pain.** Lilly's and La Novia say it doesn't happen to them;
    Yara says it can, depending on which staff member is on shift, and is fixed by swapping the dress.
  - **The pain is where a dress changes hands.** La Novia: fittings (بروفات) are her biggest problem;
    brides keep asking for their fitting times. Yara (Matareya): her biggest fear is the customers
    themselves, whether they collect the dress and bring it back. Recording bookings is not her issue.
  - **Segment matters.** Popular-area ateliers (Matareya) worry about customer reliability and returns;
    upscale ones about scheduling and competition. Track the area on every call.
  - **Adoption barrier:** Yara's staff "aren't the best level"; any tool must work for low-skill staff.
  - **Market pressure:** Lilly's says young girls are opening ateliers and renting cheaper.
  - **A churned system customer:** Glowy paid for an atelier system and stopped (not useful for
    ateliers). Closed for this sprint; we don't chase uninterested owners.
  - **Price:** La Novia called 500/month "very good" and proposed a 2-week free trial herself.
    Lilly's called it "a bit much". Both heard the price too early (see script rule).
- **Reading:** the original booking-calendar problem is weakening. Don't kill yet. Over the next
  3 owners, ask about handovers (fittings, pickup, return) and get a dated story with a cost.
- **Waiting on** (each has a one-time Jarvis reminder):

  | Shop | What we're waiting for | Follow-up |
  |---|---|---|
  | La Novia, Ms Manal (owner) | Lock a start date for her 2-week trial (= first commitment) | Mon 16 Nov 7:30 PM call |
  | Lilly's (owner) | Reply to the "free for 3 owner intros" offer; get her name | Mon 16 Nov 8:00 PM |
  | Chantelle Cocktail | Staff said the owner would call back | Mon 16 Nov 8:00 PM call if not |
  | La Perla, Madame Minna | Call back; she's moving the atelier | Mon 16 Nov 1:30 PM |
  | Kelly, manager Reham | Owner's permission | Mon 16 Nov 2:00 PM |
  | Princess (Ms Ahd), Ranah, Mona's, Satsha | Owner reach | Mon 16 Nov 1:30–2:30 PM, one call each, no WhatsApp |
  | Styliiish | Manager asked to answer on WhatsApp; Q1 sent 9:02 AM, no reply (2 unanswered) | Tue 17 Nov: check only, send nothing |
  | Moller | Personal number 01098245913; declined call, WA unanswered | One call Sun night, then parked for the week |

- **Learned:** saying "soiree" made a wedding shop answer "we're different". Managers press for the
  real reason (answer it honestly). Staff never give the owner's number; get her name instead.
  Owners who already have or dropped a system and aren't interested are closed, not chased.
- Rental evidence for every lead on the list is noted on its sales lead (checked in Chrome).

## Tooling notes

- Jarvis reminders are **one-time** (`on_date`) unless Mohamed asks for a repeat (megz-assistant PR #1, 14 Nov).
- Wrong Discovery rows: remove them in the study page or with MCP `remove_touchpoint` (gateling.com #62/#63).

## Deferred (not now)

- **Legal entity in Egypt:** register Gateling as a company. Needs time and money that isn't there
  yet. Start once the first clients pay. Tracked as a Jarvis quarter goal.
- Distributor build, CRM rebuild: see their own docs. Discovery comes first.

## Where things live

| What | Where |
|---|---|
| Owner talks, quotes, verdict | Discovery app `/discovery` (MCP: gateling-discovery) |
| Lead facts, rental evidence, call notes | Sales pipeline (MCP: gateling-sales) |
| Daily reminders, goals, tasks | Jarvis / Megz Assistant (Telegram) |
| Call script | `docs/discovery-call-script.md` |
