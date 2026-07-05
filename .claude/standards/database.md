# Standard: Database (Drizzle / PostgreSQL)

## Migrations (hard rules — enforced by `/migration`)

1. Schema-first: change the Drizzle schema, generate with `db:generate`, apply with `db:migrate`. **Never** hand-write structural SQL. **Never** `db:push` in place of a committed migration.
2. Commit the generated `.sql` + `meta/` snapshot + `_journal.json` together.
3. Hand-written SQL only for data steps (backfills, conversions) — committed with a note on the data effect.
4. Populated-table changes use expand–migrate–contract: add new shape → backfill/dual-write → switch reads → contract in a **later** release.
5. Review generated SQL before applying — catch accidental drop/recreate on renames.

## Schema design

- Every table: primary key, `createdAt`/`updatedAt`. Foreign keys declared with explicit `onDelete` behavior — decided, not defaulted.
- Enums via pg enums or checked text with a Drizzle enum type — never free text for finite states.
- Money as integer minor units; timestamps as `timestamptz`; prefer `NOT NULL` with a default over nullable-and-hope.
- Soft delete only when the domain requires recovery/audit — and then every query filters it via a shared helper, not per-call discipline.

## Queries

- No N+1: batch with `inArray`, joins, or the relations API. A query in a loop is a defect.
- Select the columns you need on hot paths; `LIMIT` on everything user-facing.
- Index decision for every FK and every column in frequent WHERE/ORDER BY. Composite indexes match query column order.
- Multi-statement invariants (transfer, counters, uniqueness beyond a constraint) run in a transaction. Constraints in the DB, not just app code — the DB is the last line of defense.

## Data integrity

- Uniqueness, referential integrity, and check constraints live in the schema. App-level validation is UX; DB constraints are correctness.
