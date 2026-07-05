---
name: refactor
description: Workflow for restructuring code without changing behavior — including paying down tracked technical debt.
---

# Workflow: Refactoring / Tech Debt

**Entry criteria:** code needs restructuring with **no behavior change**, or a
`docs/tech-debt.md` item is being paid down. If behavior changes, it's `/feature`
or `/bugfix` — don't mix.

## Phases

### 1. Justify and scope
- State the concrete payoff (velocity, bug class eliminated, complexity removed). "Cleaner" is not a payoff.
- Define a hard boundary: which files/modules are in scope. Refactors die by creep.
- Large structural moves (3+ modules): get an `architect` design first.

### 2. Establish the safety net
- The touched code's behavior must be pinned by tests **before** you move anything. Missing coverage? Write characterization tests first (role: QA).

### 3. Execute in reversible steps
- Sequence of small, individually-green steps — typecheck and relevant tests pass after each. Never a big-bang rewrite of the whole scope at once.
- Behavior-preserving means output-identical: same errors, same edge cases, same API shapes.

### 4. Verify and close
- Full quality gates (`standards/quality-gates.md`). Test *diff* should be near-zero — changed test expectations mean you changed behavior; stop and account for it.
- Update `docs/tech-debt.md` (item cleared) and `docs/architecture.md` if structure moved.
- Summary: what changed structurally, evidence behavior is identical, payoff achieved.

**Done means:** identical behavior proven by unchanged tests, scope boundary respected, debt ledger updated.
