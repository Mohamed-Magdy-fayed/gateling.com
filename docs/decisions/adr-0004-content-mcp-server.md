# ADR-0004: Admin content is writable by AI agents through an MCP server on the admin's own tRPC procedures

- **Date:** 2026-10-08
- **Status:** accepted

## Context

Content that lives behind the admin UI (case studies, blog posts, services,
testimonials) was only writable by a person clicking through `/work-mgmt`,
`/blog-posts` and friends. Content writing is increasingly done by AI agents,
and the owner wants any agent holding a credential he issues to do that work
directly. Before this, an agent's only alternative was a hand-written data
migration, which needs a deploy and bypasses the app's validation and publish
events.

## Decision

We expose a **content-only MCP server** at `/api/mcp` (Streamable HTTP,
stateless), authenticated by **per-admin API keys** stored hashed in a new
`api_keys` table and managed on `/settings`. Each tool calls the **existing
tRPC procedure through a server-side caller** whose session is the key's
owner, so validation, slug uniqueness, block upserts and Inngest publish
events are exactly the UI's. The server has no delete tools and does not
expose users, settings, leads, bookings or sales. The shape follows Gateling
Meetings' MCP server (same SDK, same key scheme with a `gl_live_` prefix).

Details and the agent-facing guide: [`docs/content-mcp.md`](../content-mcp.md).

## Alternatives rejected

- **Data migrations for content** — need a deploy per change, skip app
  validation and publish events, and pile content into the migration history.
  Still the fallback when the MCP server is unavailable.
- **A REST API plus MCP twin (Meetings' model)** — no non-agent consumer
  exists yet; a second surface would only add code to keep in sync.
- **Separate MCP-only service functions** — duplicates the admin mutations
  and drifts from them; calling the tRPC procedures keeps one code path.
- **One shared key in an env var / settings row** — no per-agent revocation,
  no "who did this" (`createdBy` is the key owner), and rotation needs a deploy.

## Consequences

- A key can do whatever its owner admin can do *within the content tools*;
  demoting or deleting the owner disables the key.
- Writes go to the live database immediately; `create_*` makes drafts, and
  publishing is an explicit tool call.
- New admin-managed content types should get tools here when they ship
  (`src/features/system/api-keys/server/mcp-server.ts`).
- `update_*` replaces whole records (the tRPC update schemas are full
  objects); agents must read before writing — stated in the guide.
