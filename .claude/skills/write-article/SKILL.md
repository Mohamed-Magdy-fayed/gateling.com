---
name: write-article
description: Generate bilingual (EN/AR) SEO blog article pairs for Gateling's content engine and insert them as DRAFT blog_posts rows with ordered blocks[] — never published automatically. Use whenever asked to write a blog article, produce a "perfect scenario"/"solution we built" pair for a vertical (cafes, schools, retail, delivery, etc.), grow topic clusters, or feed the SEO content pipeline described in the portfolio blueprint's Phase 4. Also use for one-off article requests ("write an article about X") even outside the pair model.
---

# /write-article

Produce SEO-driven blog content for Gateling as **structured, bilingual draft rows** — not
markdown files. Every article is a `blog_posts` row plus an ordered `blog_post_blocks[]`
array, inserted with `status: "draft"`. A human always reviews and publishes from
`/blog-posts` in the admin. This skill never sets `status: "published"` and never triggers
the publish mutation.

---

## Phase 0 — Confirm scope before writing anything

Before researching, nail down:
1. **Vertical / topic** (e.g. cafes, schools, retail, delivery) and which article of the
   pair this is — **A ("the perfect scenario")** or **B ("the solution we built")** — or
   whether this is a standalone one-off article.
2. **Proof source for Article B** — the real case study this vertical maps to. Look it up in
   `case_studies` (via `caseStudies.list`/`caseStudies.publicList`, or grep
   `src/drizzle/seed/*.ts` for seeded case studies) before drafting. Article B must cite a
   real project — no invented client stories.
3. **Target keyword** — ask the user if not given, or infer the strongest commercial-adjacent
   phrase for the vertical (e.g. "cafe reservation system", "school fee management software").

If the user just says "write an article about the delivery vertical," treat that as "produce
the full pair (A + B)" unless they ask for one specifically.

---

## Phase 1 — Research

Use `WebSearch` / `WebFetch` for the target keyword:
- Search volume signals / commercial intent (is this a "how to" query or a "software for X"
  query?).
- "People also ask" questions and common phrasing — these become H2/H3s.
- Competitor angles — what do existing articles on this topic cover, and what do they miss
  (usually: real proof, regional specifics, actual numbers).
- The vertical's real pain points — cross-reference against the case study's
  `problemStatement`/`solution`/`results` fields so Article A's "ideal solution" isn't
  generic and Article B's narrative has concrete detail to draw on.

Keep this phase light — a handful of searches, not an exhaustive audit. The goal is enough
real signal to avoid writing generic filler, not a full SEO audit.

---

## Phase 2 — Design the outline

For **Article A — "the perfect scenario"** (informational, vendor-neutral):
- What does an ideal solution look like for this problem? Educational, not a pitch.
- Structure: H1 → problem framing → what "good" looks like, broken into H2s mapped to the
  researched questions → a short "what to look for" / checklist section → soft CTA.
- Ranks for how/what queries. No hard sell.

For **Article B — "the solution we built"** (proof story):
- The actual project narrative: problem → build decisions → outcomes → lessons learned.
- Structure: H1 → the real problem (from the case study) → what was built and why (technical
  and product decisions worth explaining) → results (use the case study's `results.metrics`)
  → lessons / what's next → CTA.
- This is a case study in article form — reuse the case study's `problemStatement`,
  `solution`, and `results` as the factual backbone; don't contradict them.

Both articles share the same target vertical and should feel like a matched pair, not two
unrelated posts.

---

## Phase 3 — Interlinking rules (enforce these, don't skip)

- **A ↔ B cross-link** — each article links to its pair once, in context (not just a related-
  posts widget).
- **Both → case study** — each article links to `/work/[slug]` for the real project (use the
  case study's actual `slug`).
- **Optional → pillar page** — if a vertical pillar/solutions page exists, link to it; skip if
  not built yet.
- **CTA with attribution** — every article's CTA points to
  `/contact?source=article-<vertical>-<a|b>` (e.g. `/contact?source=article-delivery-a`) so
  Phase 2 lead attribution can tell which article converted. Use the block's `cta` type
  (see Phase 4) for this, not a plain text link — it renders consistently and is trackable.

---

## Phase 4 — Draft bilingual content as ordered blocks

Content is **not** a single markdown/HTML string — the `content`/`contentAr` scalar columns
on `blog_posts` are legacy and being phased out (see `docs/decisions/` for the block-content
ADR if present). Produce an **ordered `blocks[]` array** instead, matching the shape in
`src/features/system/shared/content-blocks.ts` (`blockItemSchema` / `BlockDataByType`).

Read that file before drafting if you haven't already this session — it's the single source
of truth for what each block type accepts. Building the array:

- Break the outline into blocks in reading order, each with a `sortOrder` starting at 0.
- Use `heading` blocks for H2/H3s (`data.level`), `paragraph` for body prose, `list` for
  checklists/steps, `quote` for a testimonial-style line if the case study has one.
- Use interactive blocks where they add real value, not decoration: `stats` for the case
  study's `results.metrics`, `before_after` or `comparison` for "manual pain → automated
  solution" (Article A especially), `device_player`/`gallery`/`image`/`video` wherever real
  media exists (check `case_study_media`/`blog_post_media` — don't invent media URLs; leave
  `mediaId`/`data.url` empty with a `TODO` note in your summary if no asset exists yet, rather
  than fabricating one).
- End with a `cta` block using the attribution URL from Phase 3.
- Every text-bearing block needs both `contentEn` and `contentAr` (or `data` fields with both
  `...En`/`...Ar` variants where the type has them) — **draft the Arabic yourself, don't
  machine-translate literally.** Write it as a native Arabic reader would phrase it, RTL-correct,
  matching the register of the EN version. This is a hard requirement (E-E-A-T + the project's
  i18n rule) — a Google-Translate-flavored AR draft is a rejected draft.
- Also produce the scalar fields the parent row needs: `title`/`titleAr`, `slug` (kebab-case,
  unique — check against existing posts), `excerpt`/`excerptAr` (≤512 chars, used for meta
  description and cards), `tags`/`tagsAr` (a handful, vertical + topic keywords).

**Quality bar (non-negotiable, from the content-quality guardrails):** genuinely unique and
useful, not thin filler; real project proof, not invented claims; correct native-quality
Arabic, not machine-literal; unique meta per article; no fabricated metrics or client quotes.

---

## Phase 5 — Insert as DRAFT

Insert via the existing `blogPosts.create` mutation path (tRPC router in
`src/features/system/blog-posts/server/`) or a one-off seed script following the pattern in
`src/drizzle/seed/add-case-study-ba2olak.ts` (idempotent: check for an existing slug first,
skip if found). Either way:

- `status: "draft"` — always. **Never set `"published"` and never call the publish
  mutation/router procedure.** A human reviews in `/blog-posts` and hits publish themselves.
- `blocks` — the ordered array from Phase 4, in insertion order (the mutation handles
  `sortOrder` assignment/persistence — see `upsertBlogPostBlocks` in
  `src/features/system/blog-posts/server/mutations.ts` for the exact shape expected).
- `createdBy` — if using a direct seed script (no logged-in session), use an actor id
  consistent with other content-import seeds (e.g. `"system:content-import"`).
- Leave a note in your summary to the user listing: the draft's slug/id, any `TODO`s left in
  the content (missing media, metrics needing confirmation), and that it needs a human
  publish.

---

## Checklist

- [ ] Vertical, article slot (A/B/standalone), and proof case study confirmed before writing
- [ ] Light research done — real questions/angles, not assumed
- [ ] Outline matches the "perfect scenario" (A) or "solution we built" (B) shape
- [ ] A↔B cross-link, both→case-study link, and attributed CTA (`?source=article-<vertical>-<a|b>`) present
- [ ] Content is an ordered `blocks[]` array matching `content-blocks.ts` shapes, not a content string
- [ ] Arabic is natively drafted, not machine-translated
- [ ] No fabricated media URLs, metrics, or client quotes
- [ ] Inserted with `status: "draft"` only — publish mutation never called
- [ ] Summary to user lists slug/id, open TODOs, and the pending human review step
