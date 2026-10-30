# ADR-0010: The lead's map is built from name + address; no pasted embed

- **Date:** 2026-10-30
- **Status:** accepted. Supersedes the embed parts of ADR-0008 and ADR-0009.

## Context
Each lead's map came from the listing's Share › Embed a map HTML, pasted on the lead page or sent through `set_maps_listing`. Research runs through Claude in Chrome, which redacts the embed URL's query string. So every researched lead needed the operator to open the listing and paste the HTML by hand. After 60+ researched leads, no embeds had been pasted, and every lead page showed "Add map embed" instead of a map.

## Decision
- Drop `leads.mapsEmbedSrc`, `mapsLat` and `mapsLng` (generated migration `0025_drop_lead_maps_embed`).
- `GoogleMapsCard` renders Google's keyless `https://www.google.com/maps?q=<name, address>&output=embed` page, built by `mapsEmbedUrl` in `lib/maps-embed.ts`. With no address it shows "Add address" rather than guess from the name alone.
- `sales.setMapsListing` and MCP `set_maps_listing` lose `embed`. The listing keeps `address`, `mapsCategory`, `mapsRating`, `mapsReviewCount` and `mapsCheckedAt`.
- "Open in Maps" and directions links search name + address. There are no stored coordinates any more.

## Alternatives considered
- **Keep the paste, make it optional:** rejected. The paste never happened in practice. The column and its parsing code stayed for nothing.
- **Remove the map card entirely:** rejected. The owner wants to see the location on the page.
- **Maps Embed API with a key:** rejected for the reasons in ADR-0008 (billing project, key management).

## Consequences
- Data effect: the few stored embeds and their coordinates are deleted. Their maps redraw from name + address.
- The map is only as accurate as `address`. A vague or plus-code-only address can land near, rather than on, the shop. Fix it by correcting the address.
- `output=embed` is not part of Google's documented Maps Embed API. If Google ever stops serving it, the card falls back to a blank frame, while the "Open in Maps" link still works.
- No CSP is configured. If one is added, `frame-src https://www.google.com` is still required.
