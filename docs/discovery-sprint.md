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

- Conversations: 2 real (Asma Sleem via Instagram, Madame Minna of La Perla by phone).
  The readout shows 3 until the Sama staff call is removed. Stories 0, commitments 0.
- Waiting on call-backs (Jarvis reminders): Mona's (Sun 2:00), Satsha (Sun 2:15),
  La Perla / Madame Minna (Mon 1:30: she's moving the atelier and reopening differently, a strong
  discovery opening), Kelly / manager Reham (Mon 2:00, needs owner approval).
- Rental evidence for every lead on the list is noted on its sales lead (checked in Chrome).
  Glamour Bridal and The Wedding Shop show no renting, so they're deprioritised.

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
