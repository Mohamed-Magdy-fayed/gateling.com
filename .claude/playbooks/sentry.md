# Playbook: Sentry

**Role:** error reporting + release health per `standards/errors-observability.md`.

## Setup conventions
- SDK initialized for both client and server (Next.js: the three config files via `@sentry/nextjs` wizard layout); DSN via env.
- Every event tagged with `release` (commit/tag) and `environment` — otherwise triage is archaeology.
- Source maps uploaded in CI so production stacks are readable.
- PII scrubbing on: no request bodies with user data, no tokens in breadcrumbs.

## Usage rules
- Capture the *unexpected*; expected domain failures (validation, 404s) are not Sentry events — they're logs/metrics.
- Enrich at capture: `Sentry.captureException(err, { tags, extra: { entityId } })` — a bare stack with no context is half a report.
- Inngest/background jobs report failures too — the request path isn't the only path.

## Triage (during /incident and routine ops)
- Check **release-over-release**: did the error rate step up at a deploy? That's your suspect.
- Resolve vs ignore deliberately: resolved = fixed (regression reopens it); ignored = accepted noise with a reason. Never mass-ignore to clean the dashboard.
- Recurring Sentry issue with no owner → `docs/tech-debt.md` entry or a `/bugfix` task, not permanent dashboard wallpaper.
