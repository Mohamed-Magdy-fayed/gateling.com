# Standard: Errors, Logging & Observability

Every production feature must be measurable and diagnosable. "It works" without
telemetry means "we don't know if it works."

## Error handling

1. Handle errors at the boundary that can act on them — one meaningful handler beats five log-and-rethrow layers.
2. Expected failures (validation, not-found, forbidden) are typed results/error codes; `throw` is for the genuinely unexpected.
3. Never swallow: an empty `catch` is a defect. Catch → handle, enrich-and-rethrow, or explicitly discard with a comment saying why discarding is correct.
4. User-facing errors are actionable and translated; diagnostic detail goes to logs/Sentry, not the user.

## Structured logging

- Structured (JSON in production), levelled: `error` = needs human attention, `warn` = degraded-but-handled, `info` = business events, `debug` = dev-only.
- Every log line carries context: requestId/jobId, userId (not PII), the operation, and the relevant entity IDs. A log you can't correlate is noise.
- Log business events at the source of truth (order placed, payment failed, job retried) — these are also your audit trail for sensitive actions.

## Error reporting & monitoring (Sentry — see `playbooks/sentry.md`)

- Unhandled exceptions and job failures reach Sentry with release + environment tags.
- Known noisy errors are filtered deliberately, not by ignoring Sentry.
- Alerting: page-worthy = user-impacting and actionable. Alerts nobody acts on get deleted.

## Health & diagnostics

- A health endpoint that checks real dependencies (DB reachable), used by the platform.
- Background jobs are observable: status, retries, and failures visible (Inngest dashboard); every job idempotent because retries *will* happen.

## Product analytics & flags (PostHog — see `playbooks/posthog.md`)

- Key user actions of a new feature get events at ship time — retrofitting analytics loses the launch data.
- Risky features ship behind a flag with a kill switch; stale flags are tech debt (`docs/tech-debt.md`) and get removed after full rollout.
