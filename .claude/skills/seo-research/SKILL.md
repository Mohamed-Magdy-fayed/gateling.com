---
name: seo-research
description: Niche-generic, research-backed SEO keyword research and page guidance in Arabic and English. Finds what a niche's buyers actually search (Keyword Planner, Trends, autocomplete, People Also Ask, Search Console, social platforms), studies the pages that rank, and produces a keyword map, page briefs and page audits so our pages naturally satisfy those searches. Use for "research keywords for <niche>", "what do <customers> search for", "audit this page for SEO", "why doesn't this page rank", or before writing any landing page or article.
---

# /seo-research

You are the **orchestrator** of a small research team. You think, plan, analyse and write;
a cheap Haiku worker (`seo-browser` agent) does the browsing in the user's Chrome. Run this
skill in an **Opus** session. Never browse yourself when the worker can: every page you load
into your own context costs Opus tokens.

Usage: `/seo-research <niche> [--site <url>] [--pages <url,…>] [--lang ar,en] [--market EG] [--audit-only]`
Example: `/seo-research "dress rental atelier management software" --site gateling.com --pages /solutions/atelier`

## Before anything

1. Read the knowledge base. It is the agent's "training"; do not work from memory where it
   disagrees:
   - `knowledge/how-google-ranks.md` — ranking systems, E-E-A-T, spam lines, AI Overviews
   - `knowledge/keyword-research-methods.md` — sources, playbooks, opportunity score
   - `knowledge/arabic-egypt-search.md` — registers, dialect vocabulary, spelling variants
   - `knowledge/serp-and-page-analysis.md` — intent, page capture, gap analysis, audit checklist
   - `knowledge/lessons.md` — what earlier runs learned; obey it
2. If the niche is a gateling.com product, also read `docs/STATE.md`, `docs/seo-program.md`
   and `docs/seo-baseline-2026-08-14.md`, and check `docs/seo-research/` for a previous run.
3. **Refresh volatile facts** if `knowledge/how-google-ranks.md` was last researched more than
   90 days ago or a core update has shipped since: run a few web searches, update the file
   (dated), and note what changed in `lessons.md`.
4. State the effort tier (CLAUDE.md "Effort scaling"): **S** = audit one page against an existing
   map; **M** = one niche, one language pair, up to ~8 clusters; **L** = several niches or a full
   site plan.

## Phase 1 — Frame (you, no browsing)

Write down, in the run notes: the business and offer, who buys, how they would describe the
problem in their own words, the market (default Egypt), languages, the pages in scope, and the
conversion we want (WhatsApp, demo, call). Pull real customer wording first: discovery notes,
sales-call notes, WhatsApp messages the user shares (`docs/discovery-sprint.md`, the gateling-
discovery and gateling-sales MCPs when the niche is ateliers). Then write **seeds**: 10-25 per
language, covering MSA, Egyptian colloquial, English and Franco where relevant, plus problem
phrasing ("how do I track rented dresses") not just category names.

## Phase 2 — Demand capture (worker)

Create the run folder `.seo-research/<niche-slug>/<YYYY-MM-DD>/raw/` (gitignored). Brief the
`seo-browser` agent once per job type, in this order, each with explicit inputs and the folder:

1. `autocomplete` — all seeds × letters × modifiers from the methods file (Google and YouTube).
2. `keyword-planner` — seeds plus the best autocomplete finds, Arabic pass then English pass.
   If the user is not signed in to Google Ads or billing is not set up, skip and say so.
3. `trends` — variant groups (spelling, register, language) to pick head terms and seasonality.
4. `search-console` is not a worker job: if the site has a Search Console property, ask the user
   for an export (Performance → Queries, country Egypt, 16 months) or read `.seo-baseline/`.

Keep each brief short and literal: job type, inputs list, language, folder. Do not paste the
knowledge base into briefs. Run independent jobs in parallel only if the user's Chrome copes;
default to sequential.

## Phase 3 — Cluster and choose (you)

Read the raw files. Merge variants that share one intent into **clusters** (Google merges close
variants; so do we). For each cluster record: primary phrase (highest-demand spelling), variants,
language, intent guess, demand evidence with source and date. Shortlist the top ~8-15 clusters by
business value and demand.

## Phase 4 — SERP and competitor study (worker, then you)

For the shortlist: worker job `serp` on each cluster's primary phrase in its language, then
`page` on the top 5 organic URLs per cluster (skip giants like Wikipedia or YouTube; note them),
then `social` on the primary phrases across Facebook, TikTok, Instagram, YouTube and Reddit.

Then you: classify intent and source type from the SERP, build table stakes / differentiators /
open gaps per cluster, score winnability and click retention, and compute the **opportunity
score** from the methods file. Drop clusters we cannot win or where the right page type is not
something we can be (say why).

## Phase 5 — Map, brief, audit (you)

1. **Keyword map:** one row per chosen cluster → one target URL (existing or proposed). Never
   two pages for one cluster; never one page per variant.
2. **Page briefs** for new or rewritten pages, in the shape from the analysis file, including the
   first-hand material the user must supply (screenshots, client numbers, photos, prices).
3. **Audits** for existing pages in scope: run the audit checklist, ending in a prioritised fix
   list tied to evidence. Use `page` captures of our own URLs; read the code if it is in this repo.
4. Write the report to `docs/seo-research/<niche-slug>.md` from `templates/research-report.md`.
   Summarised findings only; raw captures stay in `.seo-research/`. Keep it under ~250 lines;
   split per-page briefs into `docs/seo-research/<niche-slug>/<page>.md` if needed.

## Phase 6 — Hand-off and learning

- Implementation is a separate step: pages go through `/new-landing-page` or `/feature`,
  articles through `/write-article`, both following the briefs. This skill never edits app code,
  publishes content, or changes Google Ads, Search Console or social accounts.
- Append to `knowledge/lessons.md`: what data sources worked or failed, Egyptian phrasing
  discoveries that generalise, worker brief wording that caused mistakes. Dated, one line each.
- Update `docs/seo-program.md` / `docs/STATE.md` if the run changes the plan (non-negotiable #4).
- If any finding contradicts an existing project decision (for example the English-only SEO rule),
  put it at the top of the report as a decision for the user, not a silent change.

## Quality bar (check before you call it done)

- Every volume, range and count names its source and capture date. No invented numbers.
- Every cluster's intent claim cites the SERP evidence.
- Arabic clusters were researched in Arabic, not translated from English.
- Nothing in the briefs crosses a spam line in `how-google-ranks.md` §5.
- The report says what was **not** checked (blocked sources, skipped languages, no GSC data).

## When Chrome is not available

If Claude in Chrome tools are missing (for example in a cloud session), use the built-in
browser tools if present; otherwise fall back to web search for SERPs and ask the user to run
Keyword Planner and Trends exports themselves. Label the run "reduced fidelity" in the report.
