# Standard: Git, Branching, PRs & Versioning

## Branching (trunk-based, short-lived branches)

- `main` is always deployable. Work happens on short-lived branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `hotfix/<slug>`.
- Branches live days, not weeks. Bigger than that → slice the work or hide it behind a flag and merge incrementally.
- Hotfixes branch from production state, merge back to `main` immediately after.

## Commits

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Subject ≤72 chars, imperative.
- Each commit is one logical change and leaves the tree green. Formatting-only churn separated from logic changes.
- Never commit: secrets, generated artifacts (except committed migrations + lockfile), commented-out code.

## Pull requests

- PR body per `templates/pull-request.md`: what, why, how verified, and any gate skipped.
- Small PRs review well; >400 lines of real diff needs a reason (generated files don't count).
- CI green before review is requested. Review findings addressed or explicitly disputed — never silently ignored.
- Merge strategy: squash-merge feature branches (clean main history); the squash message follows commit conventions.

## Versioning & releases

- SemVer for anything with external consumers; date-or-sequence tags (`vYYYY.MM.DD` / `vN`) for continuously-deployed apps — pick per project, record in `docs/deployment.md`.
- Every production deploy is traceable to a commit; tags mark user-visible releases.

## CI expectations

- Pipeline runs the quality gates (`standards/quality-gates.md`) — typecheck, lint, tests, build — on every PR. A gate that only runs on laptops doesn't exist.
- Pipeline is fast (<10 min target) and deterministic; flaky CI gets fixed with `/infra`, not rerun-spammed.
