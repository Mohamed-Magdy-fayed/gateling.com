---
name: feature
description: End-to-end workflow for building a new feature — from business request to specified, implemented, tested, reviewed, documented capability.
---

# Workflow: New Feature

**Entry criteria:** a request for new capability. **Inputs:** the request; project
memory (`docs/STATE.md`).

**First, size it (kernel: Effort scaling).** S/M features run every phase below
**solo, as a checklist** — a few sentences of spec in your head or the summary,
no documents, no agents. The delegation notes per phase apply to L only. Building
a whole small app = a sequence of M features by one engineer (you), not a company
re-enacted per screen.

## Phases

### 1. Specify (role: Product — `product` agent only for L with genuinely ambiguous requirements)
- Produce a spec per `templates/feature-spec.md` (abbreviated form for small features; inline bullet list for S/M).
- Get user confirmation on scope **only if** the spec required non-obvious judgment calls; otherwise proceed.

### 2. Design (role: Architect — delegate to `architect` agent when the feature touches 3+ modules, a public contract, or the schema)
- Identify affected modules, API surface, schema changes, and rollout implications.
- Schema changes fork into `/migration` (do it first — everything else builds on it).
- Decisions worth remembering → ADR in `docs/decisions/`.

### 3. Implement
- Default: implement it yourself. Delegate `frontend` + `backend` in parallel only for L features where each half is substantial and separable — and brief them with the spec, design, and file paths so they don't re-explore.
- Follow domain standards (`standards/frontend.md`, `standards/design.md` for UI, `standards/api.md`, `standards/database.md`, `standards/typescript.md` — load what applies).
- UI work is verified per `standards/design.md`: Playwright script for flows/states (interactive browser tools are banned) + a human UI/UX checklist delivered in the close summary.
- Observability is part of implementation: key actions logged/tracked per `standards/errors-observability.md`.

### 4. Verify (role: QA — yourself for S/M; `qa` agent only when independent verification of an L feature is worth a spawn)
- Tests per `standards/testing.md`: business logic covered, acceptance criteria verified against running behavior.
- Run the full quality gates: `standards/quality-gates.md`.

### 5. Review (role: Reviewer — `reviewer` agent earns its spawn on L or tricky diffs; S/M get your own critical re-read of the diff instead. `security` agent stays **mandatory** regardless of size if the feature touches auth, payments, uploads, user input, or new integrations)
- Address must-fix findings; re-run gates after fixes.

### 6. Close
- Update project memory: `docs/STATE.md`, plus `docs/architecture.md` / `docs/domain.md` if the feature changed them.
- Summary to user: what shipped, criteria met, gates passed, anything skipped and why.
- Significant feature? Run `/retro`.

**Done means:** all acceptance criteria verified, gates passed, review approved, docs current.
