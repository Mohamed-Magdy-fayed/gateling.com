# Portfolio Blueprint

Patterns specific to the Gateling Solutions portfolio public content.

## Slug Generation

All publicly-routed content (case studies, blog posts, services) has a `slug` field.

Rules:
- Auto-generate slug from title on create: lowercase, spaces → hyphens, strip special chars
- Validate uniqueness in the `router.ts` before insert
- Slug is never auto-updated when title changes (breaking URL is worse than stale slug)
- Expose a manual override in the form dialog

Helper: `src/lib/slug.ts` → `generateSlug(title: string): string`

## Publish Flow

Entities with a publish flow (case studies, blog posts) follow this state machine:
```
draft → published → archived
         ↓
      (back to draft via "unpublish")
```

Rules:
- `status` enum: `draft | published | archived`
- `publishedAt` is set once when first published; never overwritten on re-publish
- Only `published` records appear in public tRPC queries (`publicProcedure`)
- Publishing fires an Inngest event (`case-study/published` or `blog-post/published`)
- Admin sees all statuses; public sees only `published`

## Success Story (Case Study) Structure

Each case study must contain these structured sections in the DB:

```ts
type CaseStudyResults = {
  metrics: Array<{ label: string; value: string }>  // e.g. { label: "Admin time saved", value: "70%" }
  summary: string  // 1-2 sentence outcome
}
```

The `results` column is `jsonb` storing this shape.

Public detail page sections (in order):
1. Hero: client name, industry badge, cover image, key result metric callout
2. Challenge: `problemStatement` — what was broken before Gateling
3. Solution: `solution` — what was built and how it works
4. Results: `results.metrics` as stat cards + `results.summary`
5. Testimonial: linked `testimonials` record if any
6. Related work: 2 other published case studies (excluding current)
7. CTA: "Have a similar problem? Let's talk."

SEO for case study detail:
- Title: `[client]: [key result] | Gateling Solutions`
- Description: `[problemStatement truncated to 155 chars]`
- OG image: `coverImageUrl`

## Blog Post Structure

**Body content is a normalized block model** (`blog_post_blocks` / `case_study_blocks`
tables), not the legacy `content`/`contentAr` HTML columns or the `problemStatement`/
`solution` text columns — see `docs/decisions/adr-0001-content-blocks-model.md`. Each
row is one ordered block (`heading | paragraph | list | quote | image | video | gallery |
before_after | device_player | stats | comparison | roi_embed | callout | cta`) with a
`data` jsonb bag typed per-type in `src/features/system/shared/content-blocks.ts`. The
public renderer (`src/components/blocks/block-renderer.tsx`) maps blocks → React
components — **no `dangerouslySetInnerHTML`** for the block path. The legacy HTML/text
columns are deprecated but not yet dropped: existing rows were backfilled into
`paragraph` blocks by `src/drizzle/seed/migrate-content-to-blocks.ts` (already run
locally), and both public detail pages fall back to the legacy HTML render only when
a post/case-study has zero blocks. Authoring happens in the full-page block editor
(`/blog-posts/[id]/edit`, `/work-mgmt/[id]/edit`), not the old modal dialogs (now
unused — candidates for deletion once the block editor is confirmed to fully replace
them).

Public blog post sections:
1. Hero: title, cover image, author, publishedAt
2. Content: `BlockRenderer` over ordered `blog_post_blocks` (legacy HTML fallback if unmigrated)
3. Sidebar CTA: "Working on a similar challenge?" → contact form
4. Subscribe nudge: newsletter inline form
5. Related posts: 2 other published posts

SEO for blog post detail:
- Title: `[post title] | Gateling Solutions`
- Description: `excerpt` (keep under 155 chars)
- OG image: `coverImageUrl`

## Service Card Structure

Each service on the public `/services` page shows:
- Icon (lucide icon name, rendered client-side)
- Title
- Short description
- Feature list (from `features` jsonb: `string[]`)
- CTA button → `/contact`

## Solution Pillar Pages (per-vertical, commercial intent)

One thin hub page per vertical (recommended for the top 1-2 verticals only, not every
industry) at `/solutions/<vertical>` — e.g. `src/app/(landing-pages)/solutions/delivery/`.
Aggregates the vertical's published case study + article pair rather than duplicating
content. Pattern:
- Problem-focused H1, embeds the case study (results metrics, live URL) and links both
  articles of the pair (see Blog Post Structure — perfect-scenario / solution-we-built).
- JSON-LD: `Service` (provider `#org`), `FAQPage` (vertical FAQ), `BreadcrumbList`.
- CTA links use `?source=solutions-<vertical>` for lead attribution.
- i18n: page-local `_translations/<vertical>-en.ts` / `-ar.ts` exporting a
  `solutions<Vertical>Page` namespace, imported + spread into
  `src/features/core/i18n/global/en.ts` / `ar.ts` (same convention as every other
  landing page).
- Registered in `src/app/sitemap.ts` static routes and linked from the public footer nav.
- Only build the page once the vertical's article pair is actually published — it links
  live public URLs, not drafts.

## OG Image Strategy

The site-wide default is **generated, not committed**: `src/app/opengraph-image.tsx`
renders it with `ImageResponse` at 1200×630 and Next emits the `og:image` tag
automatically. Do not add an `openGraph.images` entry to the root layout — an earlier
version hardcoded `/og-default.png`, a file that was never added to `public/`, so every
share preview 404'd. A generated route cannot drift out of existence that way.
`src/app/icon.tsx` covers the PNG app icon on the same principle.

| Page | OG image source |
|------|----------------|
| `/work/[slug]` | `case_studies.coverImageUrl` |
| `/blog/[slug]` | `blog_posts.coverImageUrl` |
| All others | generated by `src/app/opengraph-image.tsx` |

A page only needs its own `openGraph.images` when it has real artwork to show. Per-section
static images (`og-services.png`, `og-work.png`, `og-blog.png`) were specified here
previously and never produced — add a route-level `opengraph-image.tsx` if a section ever
warrants distinct artwork, rather than another binary that can go missing.

All OG images must be 1200×630px.
