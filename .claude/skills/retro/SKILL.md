---
name: retro
description: Continuous-improvement workflow — after significant work or an incident, evaluate what worked, what failed, and update the operating system itself.
---

# Workflow: Retrospective

**Entry criteria:** a significant task just completed, an incident closed, or the
user asked "what did we learn." This is how the OS improves itself — run it
honestly or not at all.

## Phases

### 1. Evaluate the work just done
Answer concretely (one line each, evidence not vibes):
- What worked well and should be repeated?
- What failed, was rediscovered from scratch, or took multiple attempts?
- Was any quality gate skipped or any standard fought against? Why?
- Did any document lie (stale docs that misled the work)?

### 2. Convert lessons into OS changes
Each lesson maps to exactly one home — pick it, don't duplicate:
- Recurring mistake in a domain → the matching `standards/` file (one added rule, not an essay).
- Process step that was missing/wasteful → the matching `skills/` workflow.
- Document shape that didn't serve → the `templates/` file.
- Project-specific fact discovered the hard way → the project's `docs/` (usually STATE.md or the relevant doc).
- Wrong routing or a missing non-negotiable → `CLAUDE.md` (rare; the kernel stays small).

### 3. Apply with discipline
- **Edit, don't append.** A standard that only grows becomes noise; integrate the new rule where it belongs, merge or delete rules it obsoletes.
- Respect the OS budget: kernel ~1.5k tokens, files ≤150 lines (`SYSTEM.md` rules). If a lesson doesn't generalize, it goes in project `docs/`, not the OS.
- No change is also a valid outcome — don't invent lessons to justify the retro.

### 4. Close
- Summary: lessons found, files changed (or "no OS changes warranted").

**Done means:** every real lesson has exactly one durable home, and the OS is no bigger than it needs to be.
