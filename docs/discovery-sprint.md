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
- **Opener:** a friend's rental atelier, where Mohamed helped organise bookings and deposits. Say
  "أتيليه تأجير" only. Naming the niche (soiree) made Kelly's manager say "we're different".
- **If pressed "why?":** the honest version: Mohamed is a developer building a booking/deposit
  system for that atelier, and wants to learn real problems before widening it. No selling, no
  price, no names or numbers needed.
- **Questions:** the last specific time (dress clash, late return, deposit dispute) and what it
  cost. Never opinions ("would you use an app?"). Script: `docs/discovery-call-script.md`.
- **Gatekeepers:** ask for the owner's name + when she's usually in. Staff never give the owner's
  private number (normal in Egypt). Leave a message, then follow up via a Jarvis reminder.
- **WhatsApp:** at most one message per shop after a no-answer, and never to a lead the sales side
  already sent 2+ unanswered WhatsApps (auto-park).
- **Consent:** ask before recording a call (Egyptian Penal Code art. 309 bis).

## Call timing (being measured)

Hypothesis A: 1–4 PM, when the shop has just opened and is quiet. Hypothesis B: owners are reachable
in the evening. Day 1 (Sat 14 Nov), 1–2 PM: 10 shops, 1 owner reached (La Perla), 3 staff messages
left, the rest no answer. Score = real owner talks ÷ dials per time block. Evening block 8–10 PM
runs the same day; compare at the 22:15 wrap-up.

## Status (2026-11-14)

Updated Sat 14 Nov, evening.

- **Conversations: 2 real** (Asma Sleem via Instagram; Madame Minna, La Perla owner, by phone).
  The readout shows 3 until Mohamed removes the Sama staff call in the app. Stories 0, commitments 0.
- **Day 1 calls (1–5 PM):** 11 shops. 1 owner reached (La Perla). Staff answered at Sama, Mona's,
  Satsha, Kelly (manager Reham) and Styliiiiish; none would give the owner's number. No answer:
  Dressy (both branches), Golden (phone off), Joe Bride (silent pickup).
- **Waiting on** (each has a one-time Jarvis reminder):

  | Shop | What we're waiting for | Follow-up |
  |---|---|---|
  | Atelier Sama (Faisal) | Owner to reply to the WhatsApp sent to 01149444780 | Check replies at the 22:15 wrap-up |
  | Dressy (Abbas El-Akkad) | Reply to the WhatsApp sent to 01038278448 | Alf Maskan branch call at 15:05 |
  | Styliiiiish | Staff said owners are reached only via Instagram; DM @styliiish.egypt | Log the DM once sent |
  | Mona's dresses | Staff passing Mohamed's number to the owner | Sun 15 Nov 2:00 PM call |
  | Satsha | Staff took a message for the owner | Sun 15 Nov 2:15 PM call |
  | La Perla, Madame Minna (owner) | She said she'd call back; she's moving the atelier and reopening differently | Mon 16 Nov 1:30 PM call |
  | Kelly, manager Reham | Asking the owner for permission; will WhatsApp | Mon 16 Nov 2:00 PM call |

- **Tonight 8–10 PM:** evening call batches (Victoria Celeste, Twig, Moller, Princess, Amour, La Novia,
  White House, Golden, Joe Bride, Chantelle, Valeria, Miss Reem, Fasateen), then the 22:15 wrap-up,
  which compares afternoon and evening reach rates.
- **Learned on day 1:** saying "soiree" made a wedding shop answer "we're different". Managers
  press for the real reason (answer it honestly, see the script). Big brands need owner approval.
- Rental evidence for every lead on the list is noted on its sales lead (checked in Chrome).
  Glamour Bridal and The Wedding Shop show no renting, so they're deprioritised.

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
