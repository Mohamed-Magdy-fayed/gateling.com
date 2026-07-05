---
name: onboard
description: Bootstrap project memory for a new or undocumented codebase — generates the docs/ structure that all other workflows read and maintain.
---

# Workflow: Project Onboarding

**Entry criteria:** a project with no `docs/STATE.md`, or memory so stale it
misleads. **Roles:** `researcher` agent for exploration, `docs` agent for writing
(or Orchestrator doing both on small projects).

## Phases

### 1. Explore
- Delegate a survey to the `researcher` agent: stack and versions, entry points, module layout, data model, auth approach, background jobs, integrations, deploy target, test setup, and any existing docs/READMEs (verify claims against code — READMEs lie).
- Mine git history for tempo: recent focus areas, active vs dormant modules.

### 2. Generate project memory
Create `docs/` per the spec in the OS `docs/README.md`. Only files with real
content — an empty section means the file isn't created yet:
- `docs/STATE.md` — the index + current snapshot (always created).
- `docs/architecture.md` — modules, data flow, key patterns, *why* shaped this way where discernible.
- `docs/domain.md` — business vocabulary and rules (created when there's real domain logic).
- `docs/deployment.md` — environments, env vars, deploy/rollback procedure.
- `docs/decisions/` — backfill ADRs **only** for decisions still actively constraining work; don't fabricate history.
- `docs/tech-debt.md` — seeded from TODOs, obvious hotspots, and known workarounds found during exploration.

### 3. Validate
- Every claim in the generated docs traceable to code you saw — mark genuine unknowns as `UNKNOWN:` rather than guessing.
- STATE.md fits on one page and links to everything else.

### 4. Close
- Report to the user: what the project is, its health (test coverage reality, debt hotspots), and the top 3 things a new engineer should know.

**Done means:** `docs/STATE.md` exists, is accurate, and a fresh session could start real work from it alone.
