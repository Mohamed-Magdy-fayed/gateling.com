# How Google ranks pages (what the agent must believe)

Sources are primary where possible: Google Search Central docs, the Search Quality Rater
Guidelines (SQRG, last revised Sep 2025), and independent analyses of the 2026 core updates.
Researched 2026-11-26. Re-verify anything marked *(volatile)* before relying on it.

## 1. The pipeline: crawl → index → serve

1. **Crawl.** Googlebot finds URLs through links and sitemaps. A page nobody links to is
   found late or never. "Discovered – currently not indexed" in Search Console means Google
   knows the URL and chose not to spend crawl on it yet: usually weak internal linking or low
   perceived value, not a technical block. gateling.com had 19 such pages at the Aug 2026
   baseline (`docs/seo-baseline-2026-08-14.md`).
2. **Index.** Google renders the page (it runs JavaScript, but server-rendered HTML is safer),
   picks a canonical among duplicates, and decides whether it is worth storing. Indexing is
   never guaranteed.
3. **Serve.** For each query Google retrieves candidates and orders them with many ranking
   systems. The order is per query, per country, per language, per device, and often per user.

## 2. The ranking systems that matter for a small site

Google publishes a ranking-systems guide. The ones a small bilingual service site lives or
dies by:

| System | What it rewards | What this means for us |
|---|---|---|
| Relevance / language understanding (BERT, MUM, neural matching) | Pages that answer the *meaning* of the query, not the literal string | Write for the need; synonyms and dialect variants are understood. Exact-match stuffing adds nothing. |
| Helpful content (folded into core ranking since Mar 2024) | People-first content made by someone who knows the subject | Thin "SEO pages" drag the whole site down, not just themselves. |
| Reviews system | First-hand evidence, measurements, pros and cons, original photos | Case studies with real numbers beat "best X" lists. |
| Link analysis / PageRank | Links from relevant, trusted pages, plus internal links | Internal linking is the cheapest lever we control. |
| Freshness | Recent content for queries that deserve it | Prices, "2026", regulations, events. Not evergreen how-tos. |
| Page experience | Fast, stable, mobile-friendly, HTTPS, no intrusive interstitials | A tiebreaker, not a ranking engine. Still mandatory on Egyptian mobile networks. |
| Local (proximity, relevance, prominence) | Google Business Profile, reviews, NAP consistency | Drives the map pack for "near me" and city queries. |
| Spam systems (SpamBrain) | Removes manipulation | See section 5. |

## 3. E-E-A-T and the Quality Rater Guidelines

Raters do not change rankings directly; their scores train and test the systems. Use the
SQRG as the closest public spec of what Google wants.

- **Experience:** did the author actually do the thing? Screenshots of the real product, real
  client numbers, photos from a real atelier.
- **Expertise:** does the author know the field? Name the author; link a profile.
- **Authoritativeness:** do others in the niche cite or mention you?
- **Trust (the centre):** accurate, honest, transparent who-runs-this-site, contact details,
  pricing clarity, no deceptive claims. A page can't score high on the others with low Trust.
- **YMYL** (money, health, safety, civics) gets the strictest standard. B2B software is mostly
  not YMYL, but pricing and contracts touch money: be precise.
- **Needs Met:** raters judge the result against the *dominant* interpretation of the query
  first, then common minor interpretations. A page that only serves a minor reading ranks for
  it, not for the head term.
- **Lowest-rated content (2025 revisions):** main content mostly copied, paraphrased, or AI
  generated with little effort or added value; "filler" that pads without helping; scaled
  pages that exist to catch keywords.

## 4. What the 2026 core updates showed *(volatile)*

Google shipped core updates in Dec 2025, Mar 2026 and May 2026 (May was the larger). Google's
only official advice stayed the same: make satisfying, people-first content; there is no quick
fix; recovery usually waits for the next core update. Independent analyses agree on:

- **Source-type fit beats raw authority.** For each query Google picks a *default destination
  type* (the vendor, a marketplace, a forum, a reference site, a video). Pages that are the
  wrong type for the intent lost even when their domain was strong (Aleyda Solis, SISTRIX data).
- **The owner of the thing beats the platform talking about it.** First-party brand and service
  sites gained against aggregators and directories (Amsive). Good news for a vendor site that
  describes its own product honestly.
- **Local-market sites beat global ones** for local intent. A `.com` with weak country signals
  can lose to a local entity. Make Egypt explicit: address, phone, EGP prices, city names.
- **Forums swing.** Reddit rose in top-3 share after May in one dataset and fell in another.
  Do not plan around forum visibility; use forums as research, not as a channel to game.

## 5. Spam policies the agent must never cross

From Google's spam policies (updated 2026-11-23):

- **Scaled content abuse:** many pages generated mainly to rank, by AI, people, or both.
  Includes one page per keyword variant, per city with swapped names, or per fan-out query.
- **Scraping / stitching:** rewriting or translating others' content without adding value.
- **Site reputation abuse, expired-domain abuse, cloaking, sneaky redirects, link schemes,
  keyword stuffing, hidden text, doorway pages.**
- **Fake mentions:** Google says chasing inauthentic mentions does not help and spam systems
  filter it.

Rule for the agent: one page per *intent*, never one page per *keyword*. Variants (spelling,
dialect, plural, English/Arabic transliteration) belong on the same page, used naturally.

## 6. AI Overviews and AI Mode *(volatile)*

- They are built on the same index and ranking systems (retrieval-augmented generation plus
  "query fan-out": the model runs several related searches). Ranking well organically is the
  way in. Google's guide (Jul 2026) calls AEO/GEO "still SEO".
- To be eligible a page must be indexed and snippet-eligible.
- Google says you do **not** need: `llms.txt`, special AI markup, "chunking" content, rewriting
  for AI, or long-tail variant pages. Structured data helps features but is not required.
- What it does reward: non-commodity content with a unique point of view, first-hand
  experience, original data, good images and video.
- Clicks: a randomized field study (2026) found an AI Overview at the top cut organic clicks on
  that query by about 38-40%. Informational queries lose the most clicks; commercial and local
  queries ("atelier system price", "برنامج اتيليه") keep more. **Prioritise intent that still
  clicks.** Search Console now has a generative-AI performance report; read it.

## 7. On-page signals that still matter

Title tag (the strongest on-page hint; keep the main phrase near the front, ≤ ~60 chars),
one clear H1, descriptive headings, the answer early on the page, descriptive internal anchor
text, image alt text, a clean slug, canonical, `lang`/`dir` set correctly, structured data that
matches visible content (Organization, Service, SoftwareApplication, FAQ only where it is a
real FAQ, BreadcrumbList, LocalBusiness), and a meta description written for the click.

## 8. What does *not* move rankings (stop worrying)

Keyword density targets, word-count targets, meta keywords, exact-match domains, publishing
frequency for its own sake, `llms.txt`, social share counts as a direct signal, and third-party
"authority scores" (no tool sees Google's internals).
