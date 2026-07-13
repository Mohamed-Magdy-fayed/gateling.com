# ADR-0001: Normalized content-blocks model for blog posts & case studies

**Status:** Accepted
**Date:** 2026-07-05

## Context

Blog post and case study body content lived in single `content`/`contentAr` (blog)
and `problemStatement`/`solution` (case study) text/HTML columns, authored via raw
`<textarea>` fields in a modal dialog and rendered publicly via
`dangerouslySetInnerHTML`. This meant: no way to place the interactive components
planned for the SEO content engine (before/after sliders, device-frame players,
stat counters, comparison tables, an inline ROI-calculator embed) inline in an
article, hand-written HTML as the only authoring surface, and a standing XSS
surface at every render of admin-authored content.

## Decision

Replace the monolithic HTML columns with a normalized **blocks** model: two new
child tables, `blog_post_blocks` and `case_study_blocks`, mirroring the existing
`*_media` child-table pattern (`parentId` FK cascade, `sortOrder`, indexed on
`(parentId, sortOrder)`). Each row is one block: a `block_type` enum (14 types),
`contentEn`/`contentAr` for text-bearing types, and a `data` jsonb bag for
type-specific props. Scalar/queryable metadata (title, slug, excerpt, tags, author,
status, client, industry, results, liveUrl) stays as columns on the parent tables —
only the narrative body becomes ordered blocks.

Media-bearing blocks (image/video/gallery/before_after/device_player) store their
media URL directly in `data` rather than via the shared `mediaId` FK to `*_media`,
because the existing media upsert pattern deletes and reinserts all rows on every
save (fresh UUIDs each time) — a block referencing a `*_media.id` would go stale on
the very next save of the post. The `mediaId` column stays in the schema for a
possible future direct-reuse-of-gallery-media feature but is unused by the v1
editor/renderer.

The public renderer maps blocks to React components by type
(`src/components/blocks/`) with **zero `dangerouslySetInnerHTML`**; inline text
formatting (bold/italic/link) goes through a hand-written regex parser
(`inline-markdown.tsx`) that returns React elements directly rather than parsing
HTML, so there's no injection surface by construction. Authoring moves from the
cramped modal to a full-page block editor (`/blog-posts/[id]/edit`,
`/work-mgmt/[id]/edit`) with an insert menu, up/down reordering (no new
drag-and-drop dependency — mirrors `GalleryManager`'s existing button-based
reorder), a live preview using the real renderer components, and debounced
autosave + explicit publish.

Existing rows were backfilled into `paragraph` blocks by a one-time, idempotent,
hand-written script (`src/drizzle/seed/migrate-content-to-blocks.ts` — a data step,
not a generated migration, per the project's migration rules) rather than requiring
re-authoring. The legacy HTML/text columns are **not dropped yet**; both public
detail pages render blocks when present and fall back to the legacy HTML/text render
otherwise, so nothing regresses before every row is confirmed migrated.

## Consequences

- **Positive:** no more `dangerouslySetInnerHTML` on the primary content path;
  authoring surface for the planned interactive/media blocks (Phase 4.6) now exists;
  each part of a post/case study is independently editable and reorderable; the AI
  content-drafting pipeline (Phase 4.2) has a clean, typed target to write into.
- **Negative / follow-up:** the `data` jsonb bag is validated as
  `z.record(z.string(), z.unknown())` at the zod layer (loose, not per-type), relying
  on admin-only `protectedProcedure` + `assertAdminRole` for trust — if a lower-trust
  "author" role is ever introduced, `data` needs per-type discriminated zod schemas
  and/or a size cap before it's exposed to that role (flagged by security review).
  URL-bearing fields (`cta.href`, inline-markdown links, video/device-player embed
  URLs) are scheme-allowlisted (`src/components/blocks/safe-url.ts`,
  `toEmbedUrl` fixed to never pass through an unrecognized scheme) as defense in
  depth even under the current admin-only trust model.
- **Deferred:** legacy `content`/`contentAr`/`problemStatement`/`solution` columns
  drop is a follow-up migration once every row is confirmed migrated and verified
  in the new editor. The old modal dialogs (`blog-post-form-dialog.tsx`,
  `case-study-form-dialog.tsx`) are now unreferenced dead code, kept in place
  pending a decision to delete them.

## Alternatives considered

- **Markdown/MDX body with inline shortcodes** for interactive blocks — rejected:
  still a single blob column, still needs an HTML/MDX render pipeline (a different
  but comparable injection surface), and doesn't give the "each part is
  independently editable" property the plan explicitly wanted.
- **Rich-text editor library (Tiptap/Plate) as the document model** — rejected for
  the *page* structure (ordered rows is the project's own model, not the library's
  document), though such a library remains a reasonable future upgrade for the
  paragraph block's *inline* editing experience specifically.
