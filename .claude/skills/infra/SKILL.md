---
name: infra
description: Workflow for infrastructure and platform changes — CI pipelines, hosting config, environments, Docker, and service integrations.
---

# Workflow: Infrastructure Change

**Entry criteria:** change to CI/CD, hosting configuration, environments,
Docker, or external service wiring. **Primary role:** `devops` agent.

## Phases

### 1. Plan with blast radius
- State what the change affects and what breaks if it's wrong (all deploys? one environment? local dev only?).
- Production-affecting changes: rollback path stated up front; user sign-off if the change is irreversible or touches billing.

### 2. Implement as code
- Everything committed: pipeline files, platform config-as-code, Dockerfiles, example env files. Console-only changes are forbidden except where the platform offers no config-as-code — then document the manual state in `docs/deployment.md`.
- New env vars/secrets: added to the example env file (no values), documented in `docs/deployment.md`, set in each environment per the relevant playbook.

### 3. Verify in the least-risky environment first
- CI change → run the pipeline and link the green run. Docker change → build and boot locally. Hosting change → preview environment before production.
- "Config looks right" is not verification; an actual successful run is.

### 4. Close
- `docs/deployment.md` updated in the same change. If local dev setup changed, README/setup docs too.
- Summary includes the verification evidence and the rollback path.

**Done means:** change is code-reviewed config, verified by an actual run, documented, reversible (or flagged).
