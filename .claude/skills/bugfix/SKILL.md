---
name: bugfix
description: Workflow for diagnosing and fixing a defect — reproduce first, fix the cause not the symptom, lock it in with a regression test.
---

# Workflow: Bug Fix

**Entry criteria:** incorrect behavior reported. Production-down or urgent
regression? Use `/incident` instead.

## Phases

### 1. Reproduce
- Capture the bug per `templates/bug-report.md` (expected vs actual, steps, environment) — from the user's report or your own investigation.
- Reproduce it: failing test, script, or observed behavior. **No fix before reproduction** — if you can't reproduce, report that finding instead of guessing.

### 2. Diagnose
- Find the root cause, not the first plausible suspect. For multi-file hunts, delegate to the `researcher` agent.
- State the cause in one sentence before fixing. If you can't, you haven't found it.
- Check for siblings: the same mistake often exists in parallel code paths — search for the pattern.

### 3. Fix
- Fix the cause. If the true fix is large, the user decides between the real fix and a documented workaround (logged in `docs/tech-debt.md`) — don't silently choose the patch.
- Minimal diff: no drive-by refactors mixed into the fix.

### 4. Verify
- Regression test that fails without the fix, passes with it (`standards/testing.md`).
- Reproduction from step 1 now passes. Quality gates per `standards/quality-gates.md`.

### 5. Close
- If the bug revealed a systemic gap (missing validation pattern, standards blind spot), note it and run `/retro`.
- Summary: root cause, fix, regression test, sibling occurrences checked.

**Done means:** reproduced → cause identified → fixed → regression-tested → gates pass.
