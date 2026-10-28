# ADR-0008: Google Maps locations live in `lead_locations`; branch count is derived

- **Date:** 2026-10-28
- **Status:** accepted

## Context
The client account page (`/sales/leads/[id]`, design in `docs/designs/Client account.html`) shows a prospect's Google Maps listing (rating, reviews, category, address, live map) and every branch the business runs. Until now a lead had one free-text `address` and an `integer` `branchCount` typed by hand, which could not hold per-branch data and drifted from reality.

The owner also decided (2026-10-28) to stop using the Google Places API. The `leads:source` CLI is removed, so all Maps data is entered by hand from the listing's Share › Embed a map code.

## Decision
- New table `lead_locations` (one row per Maps listing, `ON DELETE CASCADE` from `leads`). A partial unique index allows at most one `isPrimary` row per lead. `server/locations.ts` makes the first location primary and refuses to remove the primary location while branches remain.
- The branch count is `count(lead_locations)`. `leads.branchCount` is dropped.
- A pasted embed is never stored or rendered as HTML. `lib/maps-embed.ts` keeps only `https://www.google.com/maps/embed?pb=<allowlisted chars>`, rebuilt from the paste. The server re-parses it, and the iframe renders only a `src` that passes `isMapsEmbedSrc`.
- Typed Maps numbers carry `checkedAt`, like researched social numbers. Nothing syncs them.
- Social profiles gain `displayName` and `avatarUrl` inside the existing `socialProfiles` jsonb. The avatar must be one of our Cloud Storage URLs, because Facebook CDN links expire.

Migrations: `0019_lead_locations` (generated), `0020_backfill_primary_locations` (hand-written data step via `generate --custom`; inserts one primary location per prospect with an address or a Google Maps `sourceUrl`, and carries the review count the old Places importer wrote into `notes`; idempotent), `0021_drop_lead_branch_count` (generated). They run in that order on deploy.

Data effect: `leads.branchCount` values are discarded. A lead recorded as having N > 1 branches shows 1 location (or 0) until the operator adds the branches. The owner accepted this.

## Alternatives considered
- **Columns on `leads` for the main listing plus a jsonb branch list:** rejected. Branches need the same fields as the main shop, and editing or reordering jsonb entries loses the per-row locking that keeps "exactly one main" safe.
- **Keep `branchCount` as an independent researched number:** rejected by the owner. Two sources for one fact disagree.
- **Maps Embed API with a key for every location:** rejected. Pasted embeds need no key, and the Places/Maps APIs are being dropped.

## Consequences
- The page shows real per-branch data, and the count cannot drift.
- Existing leads start without maps or ratings. The Maps card prompts "Add map embed".
- No CSP is configured. If one is added, `frame-src https://www.google.com` is required for the map.
