# Standard: Git, Branching, PRs & Versioning

## Branching

Two tiers: feature branches merge **straight into `main`** (production).

```
feat/<slug>  ──►  main
                (production)
```

The owner chose this on 2026-11-27: it is their own site, and a bad deploy is undone in
seconds with Vercel's instant rollback or a `git revert`. The old `feat → preview → main`
flow is retired. The `preview` branch still exists but is no longer part of the flow, so
don't branch from it or merge into it. Each PR still gets a Vercel preview URL if a change
needs a look before merging.

1. **Feature branches**: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `hotfix/<slug>`.
   **Branch from `origin/main`** (fetch first). Keep them short-lived: days, not weeks.
   Anything bigger gets sliced, or hidden behind a flag and merged incrementally.
   **Check `git branch --show-current` before your first commit.** Branches created or
   switched out-of-band are easy to miss.
2. **`main`** is production. It receives squash-merged PRs from feature branches once
   the quality gates (`standards/quality-gates.md`) pass. Every merge deploys, and the
   Vercel build runs migrations first.

- Hotfixes follow the same path: a `hotfix/<slug>` branch, then a PR into `main`.
- `main` is always deployable. If a deploy breaks production, roll back first (Vercel
  instant rollback or `git revert`), then fix forward.

## Commits

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Subject ≤72 chars, imperative.
- Each commit is one logical change and leaves the tree green. Formatting-only churn separated from logic changes.
- Never commit: secrets, generated artifacts (except committed migrations + lockfile), commented-out code.

## Pull requests

- PR body per `templates/pull-request.md`: what, why, how verified, and any gate skipped.
- Small PRs review well; >400 lines of real diff needs a reason (generated files don't count).
- CI green before review is requested. Review findings addressed or explicitly disputed — never silently ignored.
- Merge strategy: **squash-merge feature branches into `main`** for a clean history. The squash
  message follows the commit conventions.

## Versioning & releases

- SemVer for anything with external consumers; date-or-sequence tags (`vYYYY.MM.DD` / `vN`) for continuously-deployed apps — pick per project, record in `docs/deployment.md`.
- Every production deploy is traceable to a commit; tags mark user-visible releases.

## CI expectations

- Pipeline runs the quality gates (`standards/quality-gates.md`) — typecheck, lint, tests, build — on every PR. A gate that only runs on laptops doesn't exist.
- Pipeline is fast (<10 min target) and deterministic; flaky CI gets fixed with `/infra`, not rerun-spammed.
