# Keyword research methods (where demand data comes from and how far to trust it)

No single source gives "the top searched keywords". Combine sources, label each number with
where it came from, and rank keywords against each other rather than trusting absolute counts.

## Source ladder (most trustworthy first)

| # | Source | What it tells you | Limits |
|---|---|---|---|
| 1 | **Google Search Console** (your own site) | Exact queries real people typed before seeing *your* result, with impressions, clicks, CTR, position. Filter by country = Egypt; regex filters work (RE2). | Only queries you already appear for. Low-volume queries are hidden for privacy. gateling.com shows almost nothing yet (baseline: 2 branded queries). |
| 2 | **Google Keyword Planner** (inside Google Ads) | Avg monthly searches for a keyword *and its close variants*, 12-month trend, competition (= advertiser competition, NOT SEO difficulty), top-of-page bid range (a strong commercial-intent signal). | Needs a Google Ads account with billing set up; no campaign needed. Low/no-spend accounts see ranges (1K-10K). Close variants are merged. Very low volumes show as 0 or "-". |
| 3 | **Google Trends** | Relative interest 0-100 over time and by region; compare up to 5 terms; rising queries. | Not volumes. Only compare inside one chart (same geo, dates, category). Low-volume Arabic terms often show "not enough data". |
| 4 | **The live SERP** (google.com.eg) | Autocomplete, People Also Ask, "People also search for", related searches, who ranks, which page types, whether ads or an AI Overview appear. | Personalised; use a clean session, set location to Egypt and language per run. |
| 5 | **Social and community search** | The words customers actually use; whether a topic is alive. | No volumes. Engagement ≠ search demand. |
| 6 | Third-party tools (Semrush, Ahrefs, Ubersuggest, Keywords Everywhere) | Estimated volumes and difficulty. | Estimates from clickstream; thin and often wrong for Egyptian Arabic. Use only as a tiebreaker, label as estimate. |

## Keyword Planner playbook

1. Location: Egypt (and optionally Cairo/Alexandria separately). Language: run Arabic and
   English as separate passes. Network: Google only.
2. "Discover new keywords" from 3-10 seeds per language, then again from a competitor URL.
3. Export. Keep: keyword, avg monthly searches (or range), 3-month change, YoY change,
   competition, top-of-page bid low/high.
4. Range workaround when no spend: in Forecasts, add the keyword as exact match with a high
   bid and read forecast impressions. Label it "forecast-derived".
5. Sort by top-of-page bid high: money changes hands there. Empty bids usually mean
   informational intent.
6. Keyword Planner is a Google Ads page: the browsing subagent can drive it in the user's
   Chrome, where they are already signed in. Never change billing, campaigns or settings.

## Google Trends playbook

- Geo Egypt, last 5 years (seasonality) and last 12 months (current), category if it helps.
- Compare variant pairs: MSA vs Egyptian vs English vs Franco (e.g. `فستان سواريه` vs
  `فساتين سواريه` vs `evening dress`). The winner is the head term of the page; the rest are
  secondary phrasings on the same page.
- Note seasonality: Ramadan, Eid al-Fitr, Eid al-Adha, wedding season (summer), graduation
  (June-July), back-to-school (Sept), White Friday (Nov). Publish 6-8 weeks before a peak.
- Read "Related queries → Rising" for new phrasing.

## SERP mining playbook (done by the browsing subagent)

For each seed, on google.com.eg with `hl=ar` and again with `hl=en`:

1. **Autocomplete:** type the seed, record suggestions. Then seed + space + each letter
   (Arabic letters ا ب ت ث ج ح خ د ... for Arabic seeds, a-z for English). Also prefix
   modifiers: Arabic `ازاي، كام، سعر، افضل، برنامج، شركة، فين، هل`; English `how, best,
   price, cost, software, app, for, vs, near me`.
2. **People Also Ask:** record each question; expand 2-3 to reveal more.
3. **Related searches / "People also search for"** at the bottom.
4. **Top 10 organic results:** URL, title, domain, page type (vendor service page, blog post,
   directory/listing, marketplace, forum, video, social post, government/reference).
5. **SERP features:** ads (how many, top/bottom), AI Overview (yes/no, which sources cited),
   map pack, video carousel, images, featured snippet, Discussions and forums.

## Social and community signal playbook

Purpose: validate that a keyword is a real phrase real buyers use, and harvest their wording.
Never invent a volume from social data.

| Platform | Where to look | What to record |
|---|---|---|
| Facebook | Search + public Groups in the niche (huge in Egypt for small businesses) | Repeated questions and complaints, in the exact words used; post dates |
| Instagram | Search bar keyword suggestions, hashtags and their post counts | Hashtag counts (order of magnitude), how businesses describe themselves |
| TikTok | Search autocomplete, "Others searched for", comments on top videos | Spoken Egyptian phrasing; question words in comments |
| YouTube | Autocomplete (alphabet trick), top video titles, view counts, comments | How-to demand; tutorial gaps |
| Reddit / forums | `site:reddit.com` and Arabic forums via Google | Buyer objections; comparison language |
| Google Maps | Search the business category in a city | How many competitors, review counts, category names Google uses |
| LinkedIn | For B2B: job titles and company pages | Decision-maker vocabulary |

Score each keyword's social signal 0-3: 0 none found, 1 appears rarely, 2 recurring in
several posts or videos, 3 recurring across platforms with recent posts.

## Prioritising: the opportunity score

For each keyword cluster (one intent), score 1-5 on each and multiply the weights:

| Factor | Weight | 5 means |
|---|---|---|
| Business value | ×3 | A searcher could become a paying client this month |
| Demand | ×2 | Highest volume band in this niche (relative, not absolute) |
| Winnability | ×2 | Top 10 has weak, off-type or foreign pages; few strong local vendors |
| Click retention | ×1 | No AI Overview, or commercial/local intent where people still click |
| Social signal | ×1 | Social score 3 |

Pick the top clusters by score; one page per cluster. Write down why each lost cluster lost.

## Hard rules

- Every number carries its source and date. Ranges stay ranges.
- Never present an estimate as a Google figure.
- Seeds come from the user and customers first (sales calls, WhatsApp, discovery notes), tools second.
