# ADR-0006: Sales is exposed through its own MCP endpoint, reachable only by keys with the `sales` scope

- **Date:** 2026-10-24
- **Status:** accepted (supersedes ADR-0004's "does not expose … leads … or sales")

## Context

The owner wants an AI agent to run the daily sales routine — read the Today
queue, prepare each contact, draft messages and log outcomes — because the
owner is not a salesperson. ADR-0004 kept sales out of the content MCP server
on purpose: its keys were unscoped, and prospects carry names and phone
numbers. Any sales tools on that server would have handed every content key
customer data.

## Decision

- `api_keys` gains `scopes text[] not null default '{content}'` (migration
  0016, additive). Existing keys stay content-only. `resolveApiKeyRequest`
  takes the required scope and returns `403` when the key lacks it.
- A separate endpoint, `/api/mcp/sales`, requires `sales`. Both endpoints
  share one route factory (`api-keys/server/mcp-route.ts`) and one set of
  tool helpers (`mcp-tools.ts`).
- Sales tools call the same tRPC procedures as the Today page, as the key's
  owner, so the prospect lock, do-not-contact guard, promise discharge and
  Meetings provisioning are identical. Outcomes are logged by the same ids as
  the Today buttons (`lib/outcomes.ts`); `get_today` returns, per lead, the
  primary action and the outcome ids allowed, via the pure `lib/agent-view.ts`.
- The server never sends messages and has no delete tools. `update_lead`
  excludes status, do-not-contact and owner; status moves only through
  logged outcomes.
- Sales access is off by default when creating a key and is labelled as
  reaching customer phone numbers.

## Alternatives rejected

- **Sales tools on `/api/mcp`** — every existing content key would gain
  customer data with no action by the admin.
- **One endpoint, tools filtered by scope** — workable, but a client sees a
  different tool list per key and a mistake in filtering leaks data; two
  endpoints make the boundary a route.
- **A raw `log_activity` tool** — lets an agent invent type/status/channel
  combinations the UI never produces; the outcome ids keep one mapping.

## Consequences

- Fixed in the same change: `updateLeadSchema` was `createLeadSchema.partial()`,
  and zod applies defaults inside `.partial()`, so a partial update reset
  `pipelineStatus` to `new` and cleared `doNotContact`. The admin form sent
  every field and was unaffected; the MCP would not have been.
- Prospect data reaches whichever AI provider the agent runs on. The owner
  accepts this by creating a sales key — the Sales access hint on /settings
  says so — and the guide tells agents to log only what the operator reports.
- Security review (2026-10-24) hardening: `log_outcome` and `update_lead` are
  annotated destructive so MCP clients confirm with the operator; lead
  `notes` are append-only for agents (`add_note`), never overwritten; an
  agent's `sourceUrl` must be http(s) (scraped data can carry injected
  instructions); the per-key rate budget is charged before the scope check;
  `update_lead` on an unknown or non-prospect id returns NOT_FOUND.
- New sales capabilities get tools in `sales/server/mcp-server.ts`; a new
  scope means a new endpoint, not a filter.
