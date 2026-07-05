# Playbook: Vercel

**Interface:** git-driven deploys (push → preview, merge to main → production).
`vercel` CLI or MCP tools for inspection; avoid console-only config (see `/infra`).

## Deploy model
- Every PR gets a preview URL — use it for verification before merge (release phase 1–2).
- Production deploys from `main`. Deployment protection/checks stay enabled.
- Env vars per environment (`vercel env add <name> <environment>`); `NEXT_PUBLIC_` is public by definition. New vars documented in `docs/deployment.md` + example env file.

## Verification & rollback
- Post-deploy: check the deployment status + build logs (`vercel inspect` / dashboard MCP tools), then hit the health endpoint and key pages on the production URL.
- **Rollback = promote previous deployment** (instant, platform-native) — not revert-and-rebuild. Know the previous deployment ID before shipping risky changes (`/release` phase 1).

## Gotchas
- Build runs `typecheck`+`build` — but local gates must pass first; Vercel is not the linter.
- Serverless limits: function duration/size — long work belongs in Inngest, not request handlers.
- ISR/cache behavior differs from local dev — verify caching-sensitive changes on a preview, not localhost.
