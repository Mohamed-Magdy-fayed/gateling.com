# Playbook: Playwright (E2E)

**Role:** the e2e layer of `standards/testing.md`, and the **only** automated UI
verification channel (interactive browser tools are banned — kernel rule 7). Two
tiers: the committed suite stays few/stable/critical-journeys-only; per-feature
verification scripts (flows + states at mobile/desktop viewports, per
`standards/design.md`) may be broader and can be pruned after the feature settles.

## Conventions
- Tests in `e2e/` (or project's existing location); config boots the dev server via `webServer` so `npx playwright test` is self-contained.
- Selectors: `getByRole`/`getByLabel`/`getByTestId` — never CSS classes or nth-child (they break on every restyle).
- Auth: log in once in a setup project, reuse `storageState` — not a login per test.
- Test data: each test creates what it needs and tolerates parallel runs; no dependence on leftover DB state.

## Anti-flake rules
- Rely on Playwright's auto-waiting (`expect(locator).toBeVisible()`); **never** `waitForTimeout` as synchronization.
- A flaky e2e test is quarantined (`test.fixme`) with a `docs/tech-debt.md` entry — not retried into green.

## Debugging
- Locally: `--ui` or `--debug`; in CI: traces + screenshots on failure (`trace: 'on-first-retry'`) — read the trace, don't guess.
- i18n note: assert on translation keys' rendered text via the locale files, and cover at least one RTL smoke check if the app ships Arabic.
