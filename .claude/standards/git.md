# Standard: Git, Branching, PRs & Versioning

## Branching

Three tiers. **Nothing goes from a feature branch straight to `main`.**

```
feat/<slug>  ──►  preview  ──►  main
                (Vercel preview)  (production)
```

1. **Feature branches** — `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `hotfix/<slug>`.
   Branched from `main`. Short-lived: days, not weeks. Bigger than that → slice the work
   or hide it behind a flag and merge incrementally.
2. **`preview`** — a **permanent, never-deleted** integration branch. Vercel builds its
   preview deployment from this branch, so the URL must stay stable. Feature branches merge
   here first and get verified on the real preview deployment before going further.
   Never force-push `preview`; never delete and recreate it — both break the Vercel
   deployment history and any bookmarked preview URL.
3. **`main`** — production. Only ever receives merges **from `preview`**, and only after
   the preview deployment has been checked.

- Hotfixes still branch from production state, but follow the same path — through `preview`,
  not around it. If an incident genuinely cannot wait for a preview build, say so explicitly
  in the summary per non-negotiable #6.
- `main` is always deployable; `preview` is always mergeable to `main`.

## Commits

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Subject ≤72 chars, imperative.
- Each commit is one logical change and leaves the tree green. Formatting-only churn separated from logic changes.
- Never commit: secrets, generated artifacts (except committed migrations + lockfile), commented-out code.

## Pull requests

- PR body per `templates/pull-request.md`: what, why, how verified, and any gate skipped.
- Small PRs review well; >400 lines of real diff needs a reason (generated files don't count).
- CI green before review is requested. Review findings addressed or explicitly disputed — never silently ignored.
- Merge strategy: **squash-merge feature branches into `preview`** (clean history); the squash
  message follows commit conventions. `preview` → `main` is a **regular merge**, not a squash —
  squashing there would rewrite commits that already exist on `preview` and cause every
  subsequent merge to conflict.

## Versioning & releases

- SemVer for anything with external consumers; date-or-sequence tags (`vYYYY.MM.DD` / `vN`) for continuously-deployed apps — pick per project, record in `docs/deployment.md`.
- Every production deploy is traceable to a commit; tags mark user-visible releases.

## CI expectations

- Pipeline runs the quality gates (`standards/quality-gates.md`) — typecheck, lint, tests, build — on every PR. A gate that only runs on laptops doesn't exist.
- Pipeline is fast (<10 min target) and deterministic; flaky CI gets fixed with `/infra`, not rerun-spammed.
