# SYSTEM.md — Operating System Map

How this `.claude` directory works, for any session that needs to understand,
maintain, or extend it. Not loaded by default — read when working *on* the OS.

## Design principles

1. **Progressive disclosure.** The kernel (`CLAUDE.md`) is always in context and stays under ~1.5k tokens. Everything else loads on demand: skills when invoked, standards when their domain is touched, playbooks when their service is used, templates when a document is produced.
2. **Roles ≠ agents.** The company's departments are responsibilities enforced by workflows and gates. Subagents exist only where a separate context window earns its cost (review independence, parallelism, read-heavy research).
3. **Single source of truth.** Quality gates live in one file. Each standard owns one domain. Templates define document shape once. Anything that needs shared content references it by path.
4. **Effort scales with the task.** The kernel's S/M/L tiers govern process weight; workflows are checklists for one engineer by default, and agent spawns must individually justify their cold-start cost. Process that outweighs the work it manages is a defect.
5. **The OS evolves.** `/retro` is the mechanism: after significant work, lessons update standards, workflows, or templates. The OS a year from now should be better than today's.

## Directory map

| Path | Role in the company | Loaded when |
|---|---|---|
| `CLAUDE.md` | Kernel: identity, routing, non-negotiables | Always |
| `SYSTEM.md` | This file — OS self-documentation | Maintaining the OS |
| `agents/` | Specialist employees (11) | Delegated to via Agent tool |
| `skills/` | Engineering workflows (11) | Invoked via routing table |
| `standards/` | Engineering rulebooks (12 domains) | Task touches the domain |
| `templates/` | Document shapes (9) | Producing that document |
| `playbooks/` | External service guides (8) | Using that service |
| `docs/README.md` | Spec for per-project memory | Running `/onboard` |

## Per-project memory (`docs/` at project root)

Created by `/onboard`, maintained by every workflow. See `docs/README.md` in this
directory for the structure spec. The entry point is always `docs/STATE.md` — a
small, current snapshot pointing to deeper documents. Sessions read STATE.md first
and follow references; they never bulk-read `docs/`.

## Escalation path

Specialist agent → Orchestrator (main session) → User.
Agents never make irreversible or scope-changing decisions; they recommend.
The Orchestrator decides within the approved scope; anything beyond scope,
destructive, or externally visible escalates to the user.

## Maintenance rules

- Adding a workflow: new `skills/<name>/SKILL.md` + one routing-table row in `CLAUDE.md`. Nothing else.
- Adding a standard: new file in `standards/` + reference it from the workflows that must enforce it.
- Changing a gate: edit `standards/quality-gates.md` only — workflows reference it, they don't copy it.
- Deleting beats deprecating. If a file stopped earning its tokens, remove it and its references.
- Keep every file under ~150 lines. If it grows past that, it's two files or it's bloated.
