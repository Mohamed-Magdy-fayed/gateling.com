# Project Memory Specification

This file specifies the `docs/` structure every project maintains at its root.
`/onboard` creates it; every workflow keeps it current (quality gate 6). This is
the company's institutional memory — a fresh session should reach productive
context by reading `docs/STATE.md` and following its links.

## Structure

```
docs/
  STATE.md           # ALWAYS — entry point: snapshot + index (≤1 page)
  architecture.md    # system shape, modules, data flow, key patterns
  domain.md          # business vocabulary, rules, invariants (if real domain logic)
  deployment.md      # environments, env vars, deploy + rollback procedure
  tech-debt.md       # known debt: item, impact, workaround, revisit date
  roadmap.md         # direction and priorities beyond current work (optional)
  decisions/         # ADRs: NNN-slug.md per templates/adr.md
  incidents/         # postmortems: YYYY-MM-DD-slug.md per templates/postmortem.md
```

Create a file only when there's real content for it. An absent file is honest;
an empty scaffold is noise.

## STATE.md shape

```markdown
# Project State — <name>            (updated: YYYY-MM-DD)
## What this is
One paragraph: product, users, stack.
## Current focus
- Active work items (link specs/PRs)
## Recent changes worth knowing
- Dated one-liners, newest first, pruned past ~10
## Read next
- Links into architecture.md / domain.md / key ADRs / tech-debt.md
```

## Reading protocol (for sessions)

1. Read `STATE.md`. 2. Follow only the links relevant to the task. 3. Never
bulk-read `docs/` — it's an index-first structure by design.

## Maintenance protocol

- The change that makes a doc stale updates it — same commit.
- STATE.md stays ≤1 page: prune "recent changes," move detail into the deeper docs.
- Contradiction between docs and code: code wins; fix the doc immediately.
