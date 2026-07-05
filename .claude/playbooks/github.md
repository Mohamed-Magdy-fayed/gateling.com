# Playbook: GitHub & GitHub Actions

**Interface:** `gh` CLI for everything (PRs, issues, runs, API) — never scrape web UI.

## Common operations
- PR lifecycle: `gh pr create --fill` (body per `templates/pull-request.md`), `gh pr view --comments`, `gh pr checks`, `gh pr merge --squash`.
- CI debugging: `gh run list --branch <b>`, `gh run view <id> --log-failed` — read the actual failing log before theorizing.
- Issues as the work ledger when the project uses them: `gh issue create/list/comment`.

## Actions conventions
- Workflows in `.github/workflows/`: `ci.yml` runs the quality gates on every PR (typecheck, lint, test, build).
- Cache package-manager store keyed on the lockfile. Pin third-party actions to a major version minimum.
- Secrets via repo/environment secrets (`gh secret set`) — never in workflow files.
- A failing required check blocks merge; fixing CI is `/infra` work, not rerun-spam.

## Rules
- Commit/push only when the user asked or the workflow requires it; never force-push shared branches.
- Anything posted to GitHub (PR bodies, comments) is outward-facing — no internal scratch notes or secrets.
