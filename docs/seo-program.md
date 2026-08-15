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
| 1 | `/services/[slug]` + internal link graph | `feat/seo-phase-1-service-pages` | **Done** — see below |
| 1.5 | Real 404s via a proxy slug check | `feat/seo-phase-1-5-real-404s` | **Done** — see below |
| 2 | Entity, metadata & schema hardening | `feat/seo-phase-2-entity-schema` | **Done** — 1 owner action outstanding, see below |
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

1. ~~**Soft 404 unresolved.**~~ **Fixed in Phase 1.5.** All three content detail routes now
   return a real HTTP 404. See `docs/seo-blueprint.md` for the root cause and the fix.
2. **The delivery article pair does not exist in the database.** `add-articles-delivery-vertical.ts`
   was never run against production. `/solutions/delivery` therefore renders without its
   articles section (the new warning logs this on every request). Only 8 blog posts exist,
   all published. Belongs to Phase 6.
3. **From the baseline, added to Phase 2:** verify `www` → non-www is a 301 with correct
   canonicals — `www.gateling.com/` ranks separately at position 49.

## Decision: client subdomains are not indexed (2026-08-14)

`tms.gateling.com`, `atelier.gateling.com` and `emanz.gateling.com` currently rank — they
pulled 23 impressions in the baseline window and produced the only non-homepage click,
including on a login URL. **Owner's decision: they should not be indexed.**

These are separate applications with their own deployments, so **the change cannot be made
from this repo.** Each needs, in its own codebase:

- `robots.txt` with `User-agent: * / Disallow: /` (in Next: a `robots.ts` returning
  `{ rules: { userAgent: "*", disallow: "/" } }`), and
- an `X-Robots-Tag: noindex, nofollow` response header, which is what actually removes
  already-indexed URLs — `robots.txt` alone blocks crawling but does **not** deindex, and a
  blocked page can still appear as a bare URL in results.

Ordering matters: ship the `noindex` header **first** and let Google recrawl, *then* add the
`Disallow`. Doing it the other way round blocks the crawler from ever seeing the `noindex`,
and the URLs stay indexed indefinitely.

Known repos: `atelier.` → `C:\Users\moham\OneDrive\Desktop\apps\atelier-management-system`;
`tms.` → a separate `gateling-tms` project. `emanz.` not located yet.

Tracked here because it is part of this program's outcome, but it is **not** work this repo
can complete.

### Phase 1 — what shipped

`/services/[slug]` now exists, driven by the `services` table
(`servicesMgmt.publicGetBySlug`). Each page carries long-form body copy, the
feature list, Service + BreadcrumbList JSON-LD, canonical/OG/Twitter metadata,
and a sitemap entry keyed off `updatedAt`. The `/services` cards were dead ends
before this phase — every card is now one anchor to its detail page, and the
`@graph` on `/services` points each Service at its own URL instead of all of them
at the hub.

Internal linking is the point of the phase: each detail page links out to curated
case studies and articles (`services/_service-links.ts`), plus every sibling
service. The related-content block was extracted to
`components/general/related-content.tsx` with resolvers in
`features/public-catalog/lib/related-content.ts`, and `/solutions/delivery` was
migrated onto it — unresolved slugs are dropped and logged in one place now
rather than per page.

Long-form copy (EN + AR) for all seven services lives in
`src/drizzle/seed/seed-service-pages.ts`, run with `npm run seed -- service-pages`.
It is deliberately conservative: it writes `fullDescription` only while NULL, and
inserts a service row only when its slug is absent, so re-running never clobbers
CMS edits.

### Phase 1 — carried forward

1. **The seed has been run against production** (2026-08-14): 4 rows backfilled,
   3 created, and a second run wrote nothing. All seven services now have EN + AR
   `fullDescription`. Re-running is safe but pointless unless a row is added.
2. ~~**`/services/[slug]` inherits the soft-404 defect.**~~ Resolved in Phase 1.5,
   together with `/blog/[slug]` and `/work/[slug]` — all three sat behind one fix.
3. **`_service-links.ts` is hand-curated and will drift.** It has no referential
   integrity with the database. Phase 3's SEO data model is the place to decide
   whether this becomes a real relation or stays editorial.
4. **The three new services have no cover image or `service_media` rows.** Their
   detail pages render the icon fallback and ship no OG image, so they will share
   links without a preview card. Upload art through the admin CMS.

Test coverage: six new cases in `e2e/seo.spec.ts` (`Service detail pages`) cover
sitemap parity with `/services`, 200s on every listed slug, canonical + OG,
Service/BreadcrumbList JSON-LD, a body-copy floor that fails if `fullDescription`
regresses to NULL, and the presence of outbound related links. The suite still
shows the documented baseline failures — 3 tests (× desktop and mobile) in
`content-blocks.spec.ts` and the homepage nav check — all unrelated to this phase.

### Phase 1.5 — what shipped

All three content detail routes (`/blog/[slug]`, `/work/[slug]`, `/services/[slug]`)
now return a real **HTTP 404** for an unknown slug, verified against production data.

`src/lib/published-slug.ts` resolves a slug against the database with one indexed
`EXISTS` probe per route family, mirroring each route's publication filter. The check
is wired into the existing auth proxy in `src/proxy.ts`, which rewrites to the
not-found route with an explicit 404 when the slug is definitely absent — before
rendering starts, which is the only point at which the status can still be set.

The `test.fixme` in `e2e/seo.spec.ts` is now three real per-route 404 tests, plus a
`every sitemap content URL still returns 200` guard that fails if the SQL filters ever
drift from the tRPC procedures they mirror.

Full root-cause writeup, and the operational notes that matter when touching the
lookup (fail-open, timeout sizing, pool sizing, camelCase column names), are in
`docs/seo-blueprint.md`.

### Phase 1.5 — why it is not the locale change that was planned

This phase was originally scoped as "move the locale into the URL so the root layout
stops awaiting `getLocaleCookie()`, so `<html>`/`<body>` leave the root Suspense, so
`notFound()` can set a status." **That premise was wrong, and the work would not have
fixed the 404s.** Recorded here so it is not re-derived:

Streaming commits the status before `notFound()` runs, and under `cacheComponents: true`
the page's own slug lookup *must* sit inside a Suspense boundary or the build fails. The
locale cookie was one of at least three dynamic dependencies above `notFound()`; removing
it leaves the page's DB lookup and `Providers`' auth/settings reads in place. Next's own
docs name proxy as the mechanism for a real 404 status, which is what shipped instead.

Effort came in at **M**, not the L that the locale rewrite would have been.

### Phase 1.5 — carried forward

1. **Locale in the URL is deferred, not done.** It has real independent value — Arabic
   currently has no distinct URL and so can never rank, and removing the sitewide cookie
   read is a prerequisite for the Phase 7 `use cache` work. It is simply not a soft-404
   fix. Schedule it on its own merits.
2. **Its two open decisions are already settled**, so a future phase need not re-litigate:
   - **English is not prefixed.** English stays at the root; Arabic goes to `/ar/*` via a
     proxy rewrite onto one `app/[locale]/…` tree. No currently-indexed URL moves, so no
     301 map is needed.
   - **The Arabic tree is `noindex` with an English canonical**, not hreflang +
     self-canonical. Lowest risk, and it keeps the existing English-only posture.
3. **The "English-only for SEO. No `/ar` routes" standing rule is unchanged** and was not
   amended, because no `/ar` route shipped here — nothing in the codebase contradicts it.
   When the locale phase lands, amend it to match decision 2 in that same change.
4. **The proxy now performs a database read on every content detail request.** It is one
   indexed probe on a unique column and fails open, but it is a new coupling between the
   edge layer and the database. If Phase 7 makes these pages properly cacheable, revisit
   whether the check can move into the cached render instead.

### Phase 2 — what shipped

`src/lib/seo.ts` is now the only way page metadata is built. `buildMetadata()` takes a
`path` and derives the canonical and `og:url` from it, and emits the full `openGraph` and
`twitter` blocks that **13 of 16 public pages were missing entirely** — every page in
`(landing-pages)` is migrated onto it. It also owns `featuredImage()` (the featured-media
lookup that was inlined six times across the three `[slug]` routes) and the JSON-LD entity
ids. `/privacy` and `/terms` gained the descriptions they never had; `/my-account` gained
an explicit `noindex`, since `robots.ts` blocks crawling but does not prevent indexing.

The Organization `@graph` in `src/app/layout.tsx` gained `address`, `areaServed`,
`contactPoint`, `founder` and `sameAs`, and its **invalid relative `logo: "favicon.ico"`
is fixed** — it resolved to `/blog/favicon.ico` on article pages and 404'd. `/about` now
emits the `Person` the Organization's `founder` references. `/work/[slug]` moved from
`CreativeWork` (too abstract to earn any rich result) to `Article`, and stopped appending
the client name to a title that already began with it.

`src/lib/company.ts` is the new single source for contact details and profile URLs. This
surfaced a live defect: the footer's YouTube link (`@mohamedfayed`) **404'd**, and its
Facebook/Instagram pointed at personal accounts while company pages existed. Footer and
graph now read the same constants. The blueprint's suggested
`linkedin.com/company/gateling` and `github.com/gateling` **do not exist** and were not
shipped — see the `sameAs` note in `docs/seo-blueprint.md`.

Two nodes were deleted rather than enriched. The homepage's `testimonials-section.tsx`
declared a *second* `Organization` reusing the same `@id` with `aggregateRating` +
`review[]` from our own testimonials, and `/work/[slug]` carried the same reviews on its
node. Self-serving review markup about the entity controlling the page is against
Google's review-snippet policy. The testimonials still render.

`/tools/roi-calculator` was **removed** — see the blueprint for why, and note it 308s to
`/services` rather than 404ing. The calculator survives as the `roi_embed` block.

Nine new tests in `e2e/seo.spec.ts` cover the logo, the Organization fields, `@id`
consistency across pages, the single-Organization rule, the `/about` Person, `Article` on
case studies, `og:url`/canonical agreement, the ROI redirect, and — the one that proves
the migration — **every sitemap URL carrying canonical + OG + Twitter tags**.

### Phase 2 — carried forward

1. **`www` → non-www is a `307 Temporary`, not a 301. This is the one item Phase 2 could
   not fix.** Measured 2026-08-14: `curl -sI https://www.gateling.com/` returns `307` with
   `Location: https://gateling.com/`. The path is preserved correctly, so only the status
   code is wrong — and a 307 tells Google the move is temporary, which is why
   `www.gateling.com/` still ranks separately at position 49.

   **Owner action, in the Vercel dashboard:** project → Settings → Domains →
   `www.gateling.com` → change the redirect status code from **307 Temporary** to
   **308 Permanent**. Google treats 308 as it does 301.

   This cannot be done from the repo. Vercel resolves domain-level redirects *before* the
   request reaches Next, so a `redirects()` rule with `has: [{ type: "host" }]` in
   `next.config.ts` would never fire — it would be dead code. Verify after the change:

   ```bash
   curl -sI https://www.gateling.com/ | grep -Ei "^(HTTP|Location)"
   ```

   **Canonicals were checked and need no work.** Every public page self-canonicals through
   `absoluteUrl()` → `BASE_URL`, and production `BASE_URL` is the non-www origin.

2. **Client subdomains: the decision is recorded above and unchanged.** What Phase 2 did
   inside this repo is add `rel="nofollow"` to the three outbound `liveUrl` link sites
   (`work/[slug]`, `work-case-card` ×2, `solutions/delivery`), so the marketing site stops
   passing equity to apps that outrank it. The `noindex` work itself still belongs to each
   client app's own repository. Confirmed 2026-08-14 that `tms.gateling.com/robots.txt`
   still serves `Allow: /` with its own sitemap, so none of it has been done yet.

3. **The founder's LinkedIn URL is unverified.** `linkedin.com/in/mohamed-magdy-fayed/`
   was supplied by the owner; LinkedIn returns HTTP `999` to automated requests, so it
   could not be machine-checked. Note the previous footer value was
   `linkedin.com/in/mohamedmagdyfayed` (no hyphens) — one of the two is wrong. Open the
   shipped link once and confirm.

4. **`clampHeadline()` truncates at 110 chars but is only applied to case studies.** Blog
   posts emit `headline` from the post title untouched. No current title is close to the
   limit; revisit if long titles start appearing.

---

## Session kickoff prompts

Paste one of these into a fresh session. Each is self-contained.

### Phase 2 — run this next

Use the Phase 2 prompt below.

### Locale in the URL — deferred, prompt kept for when it is scheduled

```
Read docs/seo-program.md and docs/seo-blueprint.md, then move locale state from
the cookie into the URL on a new branch feat/seo-locale-routing, branched from
preview.

This is NOT a soft-404 fix — that was solved in Phase 1.5 by the slug check in
src/proxy.ts, and the reasons the locale approach does not fix it are recorded
under "Phase 1.5 — why it is not the locale change that was planned". Do the work
for its own reasons: Arabic has no distinct URL today and so can never rank, and
removing the sitewide getLocaleCookie() read is a prerequisite for the Phase 7
`use cache` work.

Both design decisions are already settled — do not re-open them:
  - English is NOT prefixed. English stays at the root, Arabic at /ar/*, via a
    proxy rewrite onto one app/[locale]/… tree.
  - The Arabic tree is noindex with an English canonical, not hreflang +
    self-canonical.
Amend the "English-only for SEO. No /ar routes" standing rule in the same change
to match, since /ar routes will then exist.

Cover: the app/[locale] route tree and proxy rewrite, getT()/getLocaleCookie()
callsites taking the locale from params, locale-aware internal links and the
locale switcher, sitemap and canonical URLs, and robots.ts. No 301s should be
needed, since no English URL changes form — verify that holds.

Note the scale: ~65 internal href sites across 33+ files, plus 16 navigation
calls, and every getT() caller. This is an L-tier change.
```

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
→ Person. FIRST fix the known-invalid `logo: "favicon.ico"` in that same @graph — it is a
relative URL that resolves to /blog/favicon.ico on article pages and 404s; public/logo.png
exists and is the correct value. See the Root Layout note in docs/seo-blueprint.md. Add Person schema to /about. Switch /work/[slug] from CreativeWork to Article and
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
