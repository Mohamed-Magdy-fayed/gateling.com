---
name: release
description: Workflow for shipping to production — pre-flight gates, deploy, post-deploy verification, release notes, and the rollback procedure.
---

# Workflow: Release / Rollback

**Entry criteria:** a set of changes is ready to ship. **Roles:** Orchestrator
drives; `devops` agent executes platform steps; `qa` verifies.

## Phases

### 1. Pre-flight
- Full quality gates on the release candidate (`standards/quality-gates.md`) — green CI on the exact commit being shipped, not "was green earlier."
- Pending migrations? They deploy per `/migration` ordering: expand steps before code that needs them.
- Confirm the rollback path *before* deploying: previous deployment identifiable, migrations in this release reversible or explicitly flagged.

### 2. Ship
- Deploy per `playbooks/vercel.md` (or project's platform). Tag/version per `standards/git.md`.
- Release notes per `templates/release-notes.md` for user-visible releases.

### 3. Verify in production (mandatory — a deploy is not a release until verified)
- Health checks pass, key user journeys spot-checked on production, error rate flat in monitoring (`playbooks/sentry.md`) over the first minutes.
- Evidence in the summary: what was checked, what was observed.

### 4. Rollback (when verification fails)
- Restore previous deployment immediately — platform-native rollback, not a revert-and-rebuild race.
- Migrations complicate rollback: expanded-but-unused schema is safe to leave; contracted schema may make old code fail — this is why contract steps ship in a *later* release.
- After rollback: `/incident` phase-4 rigor for the root cause.

### 5. Close
- Update `docs/STATE.md` (shipped items leave "in progress") and `docs/deployment.md` if the procedure changed.

**Done means:** deployed, verified in production with evidence, release notes done, memory updated.
