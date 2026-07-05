# Playbook: PostHog

**Role:** product analytics + feature flags per `standards/errors-observability.md`.

## Events
- Naming: `object_action` snake_case (`order_placed`, `checkout_failed`) — consistent across the project; keep a small event dictionary in `docs/domain.md` or the analytics module.
- Capture business events **server-side** at the source of truth (the procedure that did the thing); client-side capture only for pure UI interactions. Server capture survives ad-blockers and can't be spoofed.
- Properties: IDs and enums, not free text or PII. `identify` with your userId so journeys stitch.
- New feature ships with its key events (feature workflow phase 3) — analytics retrofitted after launch loses the launch.

## Feature flags
- Risky/gradual features ship behind a PostHog flag with a kill switch; evaluate server-side where the flag gates business logic.
- Flag lifecycle: create → roll out → **remove**. Fully-rolled-out flags are tech debt (`docs/tech-debt.md`) — dead branches in code.
- Local/test environments: flags default safely (feature off) when PostHog is unreachable — never let analytics availability break the app.

## Rules
- Analytics failures are swallowed-and-logged, never user-facing.
- Respect the i18n/consent posture of the project before adding session recording.
