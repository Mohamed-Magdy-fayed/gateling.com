# ADR-0009: One Google Maps listing per lead, stored on `leads`; branches dropped

- **Date:** 2026-10-28
- **Status:** accepted. Supersedes the `lead_locations` part of ADR-0008. Its embed columns (`mapsEmbedSrc`, `mapsLat`, `mapsLng`) are superseded by ADR-0010.

## Context
ADR-0008 added `lead_locations` (a main location plus branches) for the client account page. In use, the owner found the branches section added bulk without value. They asked for a compact page: the Maps data in the header strip, the map alone in its own card, and no branches. A table holding one row per lead no longer earns its keep.

## Decision
- The listing lives on `leads`: `mapsEmbedSrc`, `mapsLat`, `mapsLng`, `mapsRating`, `mapsReviewCount`, `mapsCategory`, `mapsCheckedAt`. The listing's address is the existing `address`.
- `sales.setMapsListing` and the MCP `set_maps_listing` tool write it. Only the fields sent change, and a pasted embed is re-parsed and stored as the rebuilt src. The four location procedures and `set_location` are removed.
- The embed-safety rules from ADR-0008 are unchanged (`lib/maps-embed.ts`, a sandboxed iframe, a src re-checked on render).

Migrations (run in order on deploy):
1. `0022_lead_maps_listing`: generated; adds the columns.
2. `0023_copy_main_location_to_leads`: data step via `generate --custom`. Copies each lead's primary location into the new columns. Its address replaces `leads.address` only when it is non-blank. Idempotent.
3. `0024_drop_lead_locations`: generated; drops the table.

Data effect: branch (non-primary) locations and each location's own name are deleted. The lead's name is used instead.

## Alternatives considered
- **Keep `lead_locations` with at most one row per lead:** rejected. It is a join for a single record, plus a uniqueness rule to maintain.
- **Hide branches in the UI only:** rejected. It would leave unused data and dead code behind.

## Consequences
- The page reads everything from the lead row. `getLead` no longer returns `locations`.
- Verified on a local Postgres migrated to 0021 with production-shaped data:
  - the primary location's data moved onto the lead;
  - a blank location address kept the lead's own address;
  - the branch row went with the table.
