---
name: migration
description: Workflow for database schema and data changes — generated migrations, expand-migrate-contract for live data, verified application, stated rollback.
---

# Workflow: Database Migration

**Entry criteria:** any change to database structure or existing data.
**Primary role:** `database` agent (or the Orchestrator following its rules).
**Rulebook:** `standards/database.md` — hard rules live there; this file is the sequence.

## Phases

### 1. Design the change
- Schema change expressed in the ORM schema files first. Use `templates/migration-plan.md` for anything touching populated tables; skip the template for additive changes to empty/new tables.
- Data-affecting changes (NOT NULL on populated column, type conversion, split/merge) require the expand–migrate–contract sequence, planned as separate deployable steps.

### 2. Generate
- Generate the migration (`npm run db:generate` or project equivalent). Never hand-write structural SQL; hand-written SQL only for the data steps, clearly commented with its data effect.
- Review the generated SQL — generators occasionally produce destructive statements (drop/recreate) for what you meant as a rename. Catch it here.

### 3. Apply and verify
- Apply to a real database (local/branch DB — `playbooks/neon.md` for branch databases). "Relation already exists" means someone pushed instead of generating — stop and reconcile before proceeding.
- Verify: schema introspection matches intent; existing queries still typecheck; data steps produce the expected row counts.

### 4. Close
- Commit the generated `.sql`, `meta/` snapshot, and journal together with the schema change.
- Rollback plan stated in the PR/summary: how to reverse, and whether it's reversible at all (data loss?). Irreversible migrations get flagged to the user before merge.
- Update `docs/architecture.md` if the data model meaningfully changed.

**Done means:** generated migration committed with metadata, applied cleanly and verified, rollback path stated.
