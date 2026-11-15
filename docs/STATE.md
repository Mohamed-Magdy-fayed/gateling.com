# Project state: start here

Every agent and session reads this first (see `.claude/CLAUDE.md` → Context discipline).
Keep it short: current focus at the top, then an index. Update it in the same change that makes it stale.

## Current focus (since 2026-11-14)

**Business discovery, not building.** Mohamed is phone-calling dress-rental atelier owners to validate
the problem before selling or building anything new. Claude acts as manager of this push: plans the
day, delegates build work to separate sessions, logs every result, keeps Jarvis reminders and these
docs current.

- **Live status, rules and call-backs:** [`discovery-sprint.md`](discovery-sprint.md). Read it before any sales, discovery or outreach work.
- **Owner call script (Egyptian Arabic):** [`discovery-call-script.md`](discovery-call-script.md)
- **Where results are recorded:** Discovery app `/discovery` (MCP: gateling-discovery, guide in [`discovery-mcp.md`](discovery-mcp.md)), sales pipeline notes (MCP: gateling-sales, [`sales-mcp.md`](sales-mcp.md)), Jarvis / Megz Assistant reminders and goals.
- **On hold:** registering a legal entity in Egypt (no money yet), the distributor build, the CRM rebuild.

## How to pick up mid-sprint

1. Read [`discovery-sprint.md`](discovery-sprint.md): **"Next call plan"** is the ready-to-run list of
   calls for the next session; Status and "Waiting on" give the context. If Mohamed just wants to
   start calling, give him the first call from that list straight away.
2. Get live numbers with the Discovery MCP `get_readout` (study `91467c01-653f-4370-862f-8ee99eb5e382`) and today's Jarvis schedule with `get_reminders`.
3. Ask Mohamed what happened since the last update, log it, then update `discovery-sprint.md`.

## Index

| Area | Doc |
|---|---|
| Sales pipeline (leads, buckets, WhatsApp safety) | [`sales-pipeline.md`](sales-pipeline.md), [`sales-mcp.md`](sales-mcp.md) |
| Discovery module | [`discovery-mcp.md`](discovery-mcp.md) |
| Website content via MCP | [`content-mcp.md`](content-mcp.md) |
| SEO program | [`seo-program.md`](seo-program.md), [`seo-blueprint.md`](seo-blueprint.md) |
| Architecture and decisions | [`decisions/`](decisions/), [`entity-blueprint.md`](entity-blueprint.md), [`scaling-guide.md`](scaling-guide.md) |
| Background jobs | [`inngest-offload-policy.md`](inngest-offload-policy.md) |
| Media uploads | [`media-uploads.md`](media-uploads.md) |
| Meetings integration | [`meetings-integration.md`](meetings-integration.md) |
| Deploy facts | Vercel build runs `npm run db:migrate && next build`; merged migrations apply on deploy. Branch flow `feat/*` → `preview` → `main`. |
