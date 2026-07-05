# Migration Plan: <change>

- **Date:** YYYY-MM-DD · **Tables affected:** … · **Populated?** yes/no

## Change
Schema/data change and why.

## Strategy
- [ ] Simple additive (single migration), or
- [ ] Expand–migrate–contract:
  1. **Expand:** <additive step> — ships with release A
  2. **Migrate:** <backfill/dual-write, batch size, expected row count>
  3. **Contract:** <removal step> — ships in release B, after verification

## Data steps (hand-written SQL, if any)
Statement + expected effect (row counts, before/after invariant).

## Verification
How we prove it applied correctly (introspection, counts, query results).

## Rollback
How to reverse each step; which steps are irreversible (flag to user pre-merge).
