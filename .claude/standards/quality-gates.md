# Quality Gates

The single source of truth for "done." Every workflow references this file; none
copies it. Skipping a gate requires explicit user instruction and must be stated
in the final summary.

## Gates for every code change

| # | Gate | Pass condition |
|---|---|---|
| 1 | Typecheck | Zero errors, project-wide (`typecheck` script) |
| 2 | Build | Production build succeeds |
| 3 | Lint/static analysis | Zero errors; no suppressions added without a stated reason |
| 4 | Tests | Existing suite green; new logic covered per `standards/testing.md` |
| 5 | i18n | New user-visible strings present in **all** locale files |
| 6 | Docs | Project memory (`docs/`) updated in the same change if it went stale |

## Additional gates by change type

| Change touches… | Extra gate |
|---|---|
| Auth, payments, uploads, user input, new integration | `security` agent review — verdict recorded |
| Non-trivial diff (rule of thumb: >100 lines or any tricky logic) | `reviewer` agent review — must-fix findings addressed |
| UI | Verification per `standards/design.md`: Playwright script for flows/states (no interactive browser tools) + human UI/UX checklist delivered in the summary; accessibility per `standards/frontend.md`; RTL-safe styles |
| Schema/data | `/migration` workflow followed; migration applied and verified |
| Hot paths, lists, queries at scale | Performance sanity per the relevant standard (no N+1, no unbounded fetches) |
| Production deploy | Post-deploy verification with evidence (`/release` phase 3) |
| Observability-relevant behavior | Key actions logged/tracked per `standards/errors-observability.md` |

## Honest reporting

The done-summary must state: which gates ran, their actual results, and anything
skipped with the authorizing instruction. A red gate reported honestly is
acceptable work-in-progress; a red gate hidden is a process failure.
