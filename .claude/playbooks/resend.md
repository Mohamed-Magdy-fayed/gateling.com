# Playbook: Resend (transactional email)

**Role:** transactional email. (Projects on Nodemailer/SMTP: same rules, different client — check `docs/deployment.md` for which the project uses.)

## Sending rules
- **All email goes through Inngest**, never the request path: the procedure enqueues, the job sends. Retries, rate limits, and provider hiccups become invisible to users.
- One email module owns the client + templates; features call `sendX(...)` helpers, never the SDK directly.
- Idempotency: the sending job is idempotent (retries happen) — key on the triggering entity so a retry doesn't double-send.
- Templates: bilingual where users are (EN/AR with RTL-correct markup); every template has plain-text fallback; links absolute and environment-correct.

## Environment discipline
- Non-production **never** emails real users: dev/preview route to a catch-all test address or log-only mode, enforced in the email module by environment check — not by per-feature discipline.
- API key in env; sending domain verified (SPF/DKIM) before launch — document in `docs/deployment.md`.

## Diagnostics
- Delivery issues: check Resend dashboard logs + the Inngest run first; verify the domain's DNS before blaming code.
- Auth-critical emails (reset, verification) follow `standards/security.md`: single-use expiring tokens, no sensitive data in the email body.
