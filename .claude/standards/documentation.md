# Standard: Documentation

The reader is a future session (human or AI) with zero context. Documentation
exists to make that session productive fast — everything else is decoration.

## What gets documented, where (single source of truth)

| Knowledge | Home |
|---|---|
| Current state, priorities, active work | `docs/STATE.md` (project) |
| System shape, module map, data flow, key patterns | `docs/architecture.md` |
| Business vocabulary and rules | `docs/domain.md` |
| Decisions and their rejected alternatives | `docs/decisions/` (ADRs) |
| Known debt, workarounds, deferred work | `docs/tech-debt.md` |
| Environments, env vars, deploy/rollback | `docs/deployment.md` |
| Incidents and postmortems | `docs/incidents/` |
| Setup for humans | `README.md` |
| Company-wide rules | this OS (`standards/`) — never copied into projects |

## Rules

1. **Document why and where, not what.** Code says what. Docs earn their tokens by carrying what code can't: intent, constraints, rejected paths, tribal knowledge.
2. **Reference, don't duplicate.** Link to code paths, ADRs, and other docs. Copied content forks and rots.
3. **Stale docs are worse than no docs** — they mislead with authority. Updating memory is part of the change that made it stale (gate 6), not a follow-up task.
4. Write for retrieval: descriptive titles, one topic per file, STATE.md as the index. A doc nothing links to is invisible.
5. Absolute dates only ("2026-07-04", not "last month").
6. Comments in code follow the same rule: constraints and why, never narration.
