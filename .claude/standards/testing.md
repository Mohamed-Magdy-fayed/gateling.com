# Standard: Testing

## What to test at which level

| Level | Target | Budget |
|---|---|---|
| Unit | Pure business logic, calculations, validation, edge cases | The bulk — fast, isolated |
| Integration | Procedure/route behavior with a real (test) DB: auth, validation, persistence | The seams that unit tests fake |
| E2E (Playwright) | Critical user journeys only: signup/login, the core money path, anything whose breakage is an incident | Few, stable, expensive |

The pyramid is a budget, not a ritual: a data-heavy app needs more integration
tests; a pure library needs almost only unit tests.

## Rules

1. **Test the contract, not the implementation.** A refactor shouldn't break tests; a behavior change should. If renaming a private function breaks tests, they're testing the wrong thing.
2. **Every bug fix ships a regression test** that fails without the fix — verified by running it against the broken behavior when feasible.
3. Test failure modes, not just happy paths: invalid input, missing permissions, empty states, concurrent edits.
4. Mock at boundaries you don't own (external APIs, email, time, randomness) — not your own modules. Over-mocked tests verify the mocks.
5. Tests are deterministic and independent: no shared mutable state, no order dependence, no real network, controlled clock.
6. Flaky = broken: fix or quarantine with a `docs/tech-debt.md` entry. Retry-until-green is forbidden.
7. Coverage is a flashlight, not a target — use it to find untested *branches* in critical logic; never write assertion-free tests to move a number.

## Definition of tested (per quality-gates.md)

- New business logic: unit-covered including edge cases.
- New/changed procedures: integration test for auth + validation + effect.
- New critical journey: one e2e path.
- The suite **ran** and its actual output is in the summary — "tests written" is not "tests pass."
