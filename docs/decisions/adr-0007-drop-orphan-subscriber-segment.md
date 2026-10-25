# ADR-0007: Drop the orphan `subscriber_segment` objects from production

- **Date:** 2026-10-24
- **Status:** accepted

## Context
Production's `drizzle.__drizzle_migrations` has 19 rows after this change, while the repo journal has 18 entries (0000–0017). The extra row, `created_at = 1783278090171` (2026-07-05), sits between `0009_colorful_micromacro` and `0010_spicy_living_tribunal`. It is `0010_married_randall.sql` from the abandoned `feat/nurture-drips` branch (commit `96f1ada`, branch deleted, commit still readable with `git show 96f1ada`). It was applied to production because the local `.env` `DATABASE_URL` points at the production Neon DB (see `standards/database.md`).

That migration created enum `subscriber_segment` ('newsletter','lead-magnet','lead-nurture'), column `subscribers.segment` (NOT NULL, default 'newsletter') and index `subscribers_segment_idx`. None of these exist in `src/drizzle/schemas` or any snapshot. A read-only check of production on 2026-10-24 confirmed all three, exactly as the orphan SQL defines them, with 1 subscriber row holding the default `'newsletter'`. Nothing in `src/` reads or writes `segment`.

The orphan journal row itself does no harm. `drizzle-kit migrate` applies only repo migrations whose `when` is later than the latest applied `created_at`, so the row never re-runs and blocks nothing. The objects it created are the problem: they are drift that a future `db:generate` touching `subscribers` would not know about.

## Decision
We will drop the three objects with migration `0017_drop_orphan_subscriber_segment`. It was scaffolded by `drizzle-kit generate --custom` (journal entry + snapshot generated) and filled with hand-written `DROP ... IF EXISTS` statements. This counts as the hand-written-SQL exception in `standards/database.md`. `drizzle-kit generate` cannot emit these drops, because its 0016 snapshot never contained the objects, so it reports "No schema changes". `IF EXISTS` makes the migration a no-op on any database built from the repo journal alone (local, QA, fresh). The orphan row stays in `__drizzle_migrations` as a harmless historical record; deleting it would be a manual production write for no benefit.

Data effect: drops `subscribers.segment`. On the decision date every value was the column default, so no information is lost.

## Alternatives considered
- **Adopt into the schema:** add the enum, column and index to `subscribers-table.ts` and make the generated create statements idempotent. Rejected by the owner: nurture drips are abandoned, so the schema would carry a dead column (YAGNI).
- **Adopt, then drop, as two generated migrations:** this avoids hand-writing the drops, but it still needs a hand-edited idempotent "create" migration, and it adds two migrations instead of one.
- **Delete the orphan row from `__drizzle_migrations` as well:** rejected. It needs a manual production write, and the row has no effect on `drizzle-kit migrate`.

## Consequences
- Production's schema matches the repo again. `drizzle-kit generate` against the repo reports no changes.
- Production keeps one more migrations-table row than the journal has entries (19 vs 18). This is expected; the table count is not a drift signal on its own. Compare the shape (information_schema / pg_enum) instead.
- Root cause remains: `.env` targets production, so running `db:migrate` from any branch applies that branch's migrations to production. Run local migrations against a local container (see `standards/database.md`).

## Verification (2026-10-24, local `postgres:17-alpine` container)
1. Built production's shape: applied repo migrations 0000–0016, then the orphan SQL plus its `__drizzle_migrations` row and one subscriber. This gave 18 rows with enum, column and index present, matching production.
2. Ran `drizzle-kit migrate` with the repo journal: 0017 applied, giving 19 rows with enum, column and index gone and the subscriber row kept.
3. Re-ran migrate: no-op.
4. Ran `drizzle-kit generate`: "No schema changes".
5. Fresh database from the repo journal: all 18 migrations applied, and 0017 was a no-op.
