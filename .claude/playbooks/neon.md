# Playbook: Neon (PostgreSQL)

**Interface:** `DATABASE_URL` env var; `neonctl` CLI or dashboard for branch management.

## Branch model (the killer feature — use it)
- Production data lives on the main branch. **Never** run experiments or untested migrations against it.
- Migration testing: create a branch (`neonctl branches create --name test-<slug>`), point `DATABASE_URL` at it, run `db:migrate`, verify (`/migration` phase 3), then delete the branch.
- Preview environments can get their own branch for realistic data shape.

## Rules
- Connection strings are secrets — env only. Use the **pooled** connection string for serverless runtimes (Vercel functions), direct only for migrations.
- Migrations run per `/migration` and `standards/database.md` — Neon branching removes every excuse for testing on prod.
- Compute autosuspend: first query after idle is slow — don't misdiagnose cold starts as query regressions.

## Diagnostics
- Slow query: `EXPLAIN ANALYZE` on a branch with realistic data; check index usage before adding indexes.
- Monitor storage/compute usage when adding data-heavy features — cost is part of the design (`architect`).
