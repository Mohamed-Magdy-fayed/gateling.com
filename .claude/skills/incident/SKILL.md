---
name: incident
description: Production incident and hotfix workflow — restore service first, root-cause later, always end with a postmortem.
---

# Workflow: Production Incident / Hotfix

**Entry criteria:** production is down, degraded, or a severe regression is live.
Speed matters; process is deliberately thinner — but the gates that remain are
non-negotiable.

## Phases

### 1. Assess (minutes, not hours)
- Establish blast radius: what's broken, since when, how many users. Check monitoring/error tracking first (`playbooks/sentry.md`), then recent deploys.
- Classify: SEV1 (down/data loss) / SEV2 (major degradation) / SEV3 (contained).

### 2. Stabilize — restoration beats diagnosis
- Prefer the fastest safe reversal: **rollback the deploy** (`playbooks/vercel.md`), disable the feature flag, or revert the commit. Roll back first, investigate after.
- If rollback is impossible (data migration, external change), go to hotfix.

### 3. Hotfix (only if rollback can't restore)
- Smallest possible diff on a branch from production state.
- Reduced gate: typecheck + build + the tests covering the touched path + a security sanity check if the fix touches auth/input. Full suite runs after restoration.
- Deploy, then **verify restoration with evidence** (error rate dropping, endpoint responding).

### 4. Root cause (after service is restored)
- Switch to `/bugfix` rigor: reproduce, diagnose, fix properly, regression test. The hotfix is a tourniquet, not the fix — if it wasn't the real fix, track the real one in `docs/tech-debt.md` with a deadline.

### 5. Postmortem (mandatory for SEV1/SEV2)
- Blameless postmortem per `templates/postmortem.md`, saved to `docs/incidents/`.
- Action items become tracked work, not aspirations. Run `/retro` — incidents are the highest-value OS feedback.

**Done means:** service restored with evidence, real fix landed or tracked with a deadline, postmortem written.
