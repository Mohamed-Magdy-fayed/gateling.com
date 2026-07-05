---
name: deps
description: Workflow for dependency upgrades and audits — batched by risk, changelogs read, verified by the test suite, security-triaged.
---

# Workflow: Dependency Management

**Entry criteria:** scheduled upgrade pass, a security advisory, or a needed
version bump. **Roles:** Orchestrator; `security` agent for advisory triage.

## Phases

### 1. Audit
- `npm outdated` + `npm audit` (or ecosystem equivalent). Triage advisories by actual exposure — a dev-only transitive ReDoS is not a prod RCE; record the reasoning.

### 2. Batch by risk
- **Patch/minor, well-behaved:** one batch.
- **Majors:** one at a time, each with its changelog/migration guide actually read — never upgrade a major on version number alone.
- **Framework/runtime majors (Next, React, Node, ORM):** own task, `/research` first if the migration guide reveals breaking depth.

### 3. Upgrade and verify
- Per batch: upgrade → install clean → typecheck → full test suite → build. A green build with failing types is not green.
- Behavior spot-check for majors touching runtime behavior (auth libs, ORM, framework).
- Lockfile committed; no mixed package-manager artifacts.

### 4. Close
- Anything deliberately held back (breaking major, unpatched advisory) goes in `docs/tech-debt.md` with the reason and a revisit date.
- New dependency being *added* (not upgraded)? Gate it: maintained, scrutinized, license-compatible, and not something the codebase already solves — `security` agent checklist applies.

**Done means:** batches verified independently, advisories triaged with reasoning, holdbacks tracked.
