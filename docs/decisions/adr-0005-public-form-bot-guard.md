# ADR-0005: Public forms are bot-guarded with Turnstile, and verified signups become leads

- **Date:** 2026-10-23
- **Status:** accepted

## Context

On 2026-10-22 the `users` table held 122 "customers" and not one was a person
who might buy: 42 were Playwright accounts created against production (the
default `.env` points at the live DB), 5 were seeded demo clients, and 75 were
bots. Every bot account had a random mixed-case name, a 12-digit `20…` number
with no `+`, an unverified email (dotted Gmail variants or real-looking
corporate addresses) and no second sign-in. The rate was climbing to roughly
one an hour. Sign-up, the contact form and the newsletter box had no bot
protection at all; the phone check was "at least 10 characters".

The owner also expected people who sign up to appear in `/leads`, and none did:
`/leads` only shows contact-form submissions.

## Decision

1. **One guard for every public write** (`src/features/core/bot-guard/`),
   cheapest check first: honeypot + minimum fill time → per-IP fixed-window
   rate limit in Redis → Cloudflare Turnstile `siteverify`. Applied to
   `signUpAction`, `leads.submit` and `subscribers.subscribe`. The rejection
   never says which check tripped.
2. **Turnstile** (not reCAPTCHA/hCaptcha): free, no tracking cookies, and its
   "interaction-only" mode is invisible to almost every visitor. Tokens are
   bound to the form via `action`, so a newsletter token cannot unlock sign-up.
3. **Required on every Vercel deployment.** `env/server.ts` refuses to boot
   a production *or preview* deployment without both keys (a public preview
   URL is a sign-up form too, and may share the production DB), and refuses
   Cloudflare's `1x/2x/3x` test keys in production. On production, tokens must
   also carry our action and hostname. Without keys (local dev) the Turnstile
   step is skipped and the other checks still run.
4. **Failure modes:** Redis down → rate limit fails open (the contact form
   stays up); Cloudflare unreachable → Turnstile fails closed (a human can
   retry, a bot cannot be vouched for). The limit counts IPv6 clients per
   /64 and trusts Vercel's forwarding headers — revisit both if the domain is
   ever proxied through another layer (e.g. Cloudflare in front of Vercel).
5. **Sign-up phone must be a real E.164 number** (`libphonenumber-js/min`).
6. **A customer becomes an inbound lead when they verify their email**, not at
   sign-up: verification is the one step that proves the address is theirs.
   Created by the `on-user-email-verified` Inngest function, source `signup`,
   idempotent per email.
7. **E2E tests cannot reach production**: `playwright.config.ts` requires a
   local `E2E_DATABASE_URL` and uses Cloudflare's always-pass test keys.

## Alternatives considered

- **Honeypot + rate limit only.** No vendor, but these bots post straight to
  the server action with whatever fields they like; a honeypot only catches
  form-fillers. Kept as the cheap first layer, not the whole defence.
- **Lead at sign-up.** Simpler, but a guarded sign-up still only proves "not
  a script", not "owns this inbox"; the stolen-address pattern above would
  have filled `/leads` with people who never visited.
- **Blocking on name heuristics** (random-case strings). Effective against
  today's bot, trivially changed by tomorrow's, and risks rejecting real
  non-Latin names.

## Consequences

- Both keys must be set in Vercel for **Production and Preview** before the
  next deploy, or the build fails by design. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is inlined at
  build time.
- Verification email is still user-initiated (the notice on `/my-account`), so
  leads from sign-up arrive only as fast as people verify.
- Existing bot/test accounts are untouched by this change; cleaning them up
  is a separate, explicit data operation.
