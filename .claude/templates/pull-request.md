# PR: <title following commit conventions>

## What
The change in 1–3 sentences.

## Why
Link to spec/bug/ADR; one sentence of motivation if no link exists.

## How verified
<!-- Actual evidence, not intentions. -->
- Gates: typecheck ✅/❌ · build ✅/❌ · lint ✅/❌ · tests ✅/❌ (N passed)
- Behavior verified by: <test / manual steps / screenshot>

## Risk & rollback
Blast radius if wrong; how to reverse (revert-safe? migration involved?).

## Skipped gates
None | <gate> — authorized by <instruction>.
