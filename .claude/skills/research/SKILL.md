---
name: research
description: Workflow for answering "should we / how does / which one" questions — spikes, technology evaluation, and architecture proposals. Produces a decision, not code.
---

# Workflow: Research / Spike / Architecture Proposal

**Entry criteria:** a question needs answering before work can be committed to.
**Deliverable is a decision or recommendation, never production code.** Spike code
is disposable and lives in the scratchpad.

## Phases

### 1. Frame the question
- Write the decision to be made as one sentence, plus the criteria that matter (cost, complexity, performance, team fit) and a timebox.
- Check `docs/decisions/` first — it may already be decided. Reopening a past ADR requires new evidence, and supersedes it explicitly.

### 2. Investigate
- Delegate read-heavy exploration to the `researcher` agent; keep the main context clean.
- Prefer evidence over opinion: run the candidate library against the real use case, measure the actual query, read the installed source.
- For architecture proposals: `architect` agent produces the design with alternatives.

### 3. Decide and record
- Recommendation with rationale, rejected alternatives, and the main risk of the chosen path. Significant/contested decisions → RFC (`templates/rfc.md`) for the user to approve.
- Once decided: ADR per `templates/adr.md` into `docs/decisions/`, referenced from `docs/STATE.md` if it changes current direction.

### 4. Close
- Spike code deleted or explicitly quarantined — it never merges silently.
- If the decision unlocks work, route it: `/feature`, `/migration`, `/infra`.

**Done means:** question answered with evidence, decision recorded as an ADR, follow-up work routed.
