# SEO Program — Status & Session Handoff

Single source of truth for the multi-phase organic-SEO program. **Each phase runs in its own
session.** This file is what a cold session reads first; update it at the end of every phase,
in the same change (non-negotiable #4).

| Reference | Where |
|---|---|
| Full plan | `~/.claude/plans/gateling-seo-keyword-snug-hare.md` (outside the repo — may not survive; this file is authoritative if they disagree) |
| Baseline measurement | `docs/seo-baseline-2026-08-14.md` — frozen, do not edit |
| Per-page SEO targets | `docs/seo-blueprint.md` |
| Pillar-page pattern | `docs/portfolio-blueprint.md` |
| Branch flow | `.claude/standards/git.md` |

## Standing rules for every phase

- **One branch per phase**, named in the table below. Flow is `feat/<slug>` → `preview` →
  `main`. Branch **from `preview`**, never merge a feature branch straight into `main`, and
  run `git branch --show-current` before the first commit — it is easy to land commits on
  `preview` by accident.
- `npm run typecheck && npm run build` must pass. Baseline is known-dirty: **~236
  pre-existing lint errors and 3 fixture-slug e2e failures** on a clean tree. Compare against
  that; never claim a clean run.
- **`.env` points at production Neon.** Any script that writes is a production write. Confirm
  the target before running.
- English-only for SEO. No `/ar` routes, no hreflang. Arabic remains a full app language —
  new user-facing strings still need `en` + `ar` entries.
- Schema changes go through `/migration`: edit schema → `npm run db:generate` →
  `npm run db:migrate`. Never hand-write structural SQL, never `db:push`.

---

## Phase status

| Phase | Scope | Branch | Status |
|---|---|---|---|
| 0 | Defects suppressing existing pages | `feat/seo-phase-0-defects` | **Done** — 1 item unresolved, see below |
| 1 | `/services/[slug]` + internal link graph | `feat/seo-phase-1-service-pages` | **Next** |
| 2 | Entity, metadata & schema hardening | `feat/seo-phase-2-entity-schema` | Not started |
| 3 | SEO data model + admin control surface | `feat/seo-phase-3-admin-surface` | Not started |
| 4 | Content engine (`write-project` skill) | `feat/seo-phase-4-content-engine` | Not started |
| 5 | Atelier deep pass | `feat/seo-phase-5-atelier` | Not started |
| 6 | Remaining vertical pillars | `feat/seo-phase-6-pillars` | Not started |
| 7 | Crawl performance (`use cache`) | `feat/seo-phase-7-caching` | Not started |

### Phase 0 — what shipped

Stats blocks now render real numbers server-side (`stats-block.tsx`); OG image and icon
generated via `opengraph-image.tsx` / `icon.tsx` instead of missing binaries; `/solutions`
hub added with a registry (`solutions/_solutions.ts`) that also drives the sitemap;
`/solutions/delivery` given a Suspense fallback and missing-content warnings; homepage H1
fixed (was two spans concatenated with no space) and realigned with its title; `/about` H1 no
longer duplicates the homepage title tag, metadata moved out of a metadata-only layout.

### Phase 0 — carried forward

1. **Soft 404 unresolved.** `/blog/<unknown>` and `/work/<unknown>` return HTTP 200 with the
   404 UI. Root cause and four rejected fixes are documented in `docs/seo-blueprint.md`.
   **The baseline shows zero soft 404s reported by Google**, so this is deprioritised — but
   re-check the Pages report each measurement.
2. **The delivery article pair does not exist in the database.** `add-articles-delivery-vertical.ts`
   was never run against production. `/solutions/delivery` therefore renders without its
   articles section (the new warning logs this on every request). Only 8 blog posts exist,
   all published. Belongs to Phase 6.
3. **From the baseline, two cheap items added to Phase 2:** verify `www` → non-www is a 301
   with correct canonicals (`www.gateling.com/` ranks separately at position 49), and decide
   whether client subdomains (`tms.`, `emanz.`, `atelier.`) should be indexed at all — they
   currently outrank the marketing site and expose login pages.

---

## Session kickoff prompts

Paste one of these into a fresh session. Each is self-contained.

### Phase 1

```
Read docs/seo-program.md and docs/seo-baseline-2026-08-14.md, then run Phase 1 of the
SEO program on a new branch feat/seo-phase-1-service-pages.

Build /services/[slug] detail pages driven by the existing `services` table (slugs are
already populated: custom-software-development, business-process-automation, ai-integration,
digital-transformation-consulting). Add publicGetBySlug to the services-mgmt router, link
the currently-unlinked cards on /services, extract a shared related-content component,
emit Service + BreadcrumbList JSON-LD, and add the slugs to the sitemap. Write real
fullDescription copy — do not ship placeholder text. Also seed the three new service rows:
web-app-development, dashboards-and-reporting, system-integrations.
```

### Phase 2

```
Read docs/seo-program.md, then run Phase 2 on a new branch feat/seo-phase-2-entity-schema.

Add src/lib/seo.ts with a buildMetadata() helper and migrate public pages onto it. Extend
the Organization @graph in app/layout.tsx with address, areaServed, contactPoint and founder
→ Person. Add Person schema to /about. Switch /work/[slug] from CreativeWork to Article and
add its missing twitter block. Flesh out /tools/roi-calculator with real copy + FAQPage.
Also: verify www → non-www is a 301 with correct canonicals, and decide whether client
subdomains should be indexed (see the baseline doc).
```

### Phase 3

```
Read docs/seo-program.md, then run Phase 3 on a new branch feat/seo-phase-3-admin-surface.

One migration covering: SEO columns (metaTitle, metaDescription, ogImageUrl, noindex) on
blog_posts/case_studies/services; an alt column on the three media tables; and a
seo_query_stats table. Then a Google Search Console service-account client, a daily Inngest
sync following the booking-triage-digest cron pattern, and an admin /seo section with
Performance, Health and Tools tabs. Add /seo to robots.ts disallow. The `security` agent
review is mandatory here — new external integration plus private-key handling.
```

### Phases 4–7

See the phase descriptions in `~/.claude/plans/gateling-seo-keyword-snug-hare.md`, or ask
for a kickoff prompt to be written when the earlier phases land — the later phases depend on
what Phases 1–3 actually produce, so writing their prompts now would be guessing.

---

## Measurement cadence

Re-export Search Console **2–4 weeks after Phase 1 reaches production** (not after it
merges — after it is live and crawled). Compare against `docs/seo-baseline-2026-08-14.md`
and write the result to a new `docs/seo-measurement-<date>.md`. Watch three numbers:
indexed count (baseline **10**), "Discovered – currently not indexed" (baseline **19**), and
any non-branded impression at all (baseline **0**).
