# Studying the ranking pages and auditing our page

The SERP is Google telling you what it thinks satisfies the query. Copy the *intent and the
format*, never the words.

## 1. Classify intent from the SERP, not from the keyword

| Intent | SERP looks like | Page we need |
|---|---|---|
| Informational ("ازاي", "what is") | Blogs, PAA, video, AI Overview | A guide that genuinely teaches; soft CTA |
| Commercial investigation ("best", "افضل", "vs", "سعر") | Listicles, comparisons, reviews, vendor pages | Comparison or buyer's guide with honest criteria and prices |
| Transactional ("buy", "demo", "اشتراك", "برنامج X") | Vendor/product pages, ads at top | Service or product page with price, demo, WhatsApp |
| Local ("near me", "في مدينة نصر") | Map pack, directories, GBP | Google Business Profile plus a location-aware page |
| Navigational (a brand) | The brand's own site | Nothing to win unless it is our brand |

**Mixed SERPs:** if the top 10 splits between two intents, Google sees two readings. Target the
dominant one with the main page and cover the minor one in a section, or with a second page only
if the minor reading is commercially valuable on its own.

**Source-type fit (2026):** if the top 5 are all marketplaces or directories, a single vendor
page is the wrong type; the move may be to get *listed* there and target a narrower query.

## 2. What to record from each top-10 page

The browsing subagent fills this per URL (see `.claude/agents/seo-browser.md` for the format):

- URL, domain, page type, language and dialect register
- `<title>`, meta description, H1, H2/H3 outline
- Approximate word count; whether the answer appears in the first screen
- Media: real photos vs stock, video, screenshots, diagrams
- Trust: named author, company address, phone/WhatsApp, prices shown, reviews/testimonials, case studies with numbers, dates
- Structured data types present (from JSON-LD in the page source)
- Conversion: CTA type and position
- Freshness: published/updated date
- Unique angle: what it offers that the others don't
- Weaknesses: outdated, thin, wrong dialect, slow, no prices, machine translation, intrusive popups

## 3. Gap analysis (done by the orchestrator)

From the 10 records build three lists:

1. **Table stakes:** subtopics, questions and elements that appear in 6+ of the top 10. Our page
   must cover these or it is not a credible answer.
2. **Differentiators:** things only 1-2 pages do well that searchers clearly value (PAA,
   comments, forum questions).
3. **Open gaps:** questions from PAA, autocomplete and social research that *no* top-10 page
   answers well. These are where our first-hand experience wins (Google's "non-commodity"
   content).

Winnability notes: count local Egyptian vendors in the top 10, check whether pages are thin or
old, check whether results are in the wrong language or dialect for the query.

## 4. Page brief (what the orchestrator hands to whoever writes the page)

- Target cluster: primary phrase (highest-demand spelling), secondary phrasings, language
- Intent and page type, with the SERP evidence
- Title tag and H1 proposal (different but aligned), meta description
- Outline: H2s covering table stakes, then differentiators, then open gaps
- First-hand material needed from the owner: screenshots, client numbers, photos, quotes, prices
- FAQ block built from real PAA and social questions in the searcher's own words
- Internal links: which existing pages link in, which pages this links out to, anchor texts
- Structured data to add
- Conversion element and placement
- What not to do: no keyword stuffing, no spun variants, no fake reviews

## 5. Auditing an existing page against its cluster

Score each line Pass / Weak / Fail with a one-line reason:

**Relevance and intent**
- Page type matches the SERP's dominant type
- Primary phrase in title (front-loaded), H1, first paragraph, URL slug — once each, naturally
- Secondary phrasings and dialect variants appear naturally in headings, body, FAQ, alt text
- Covers every table-stakes subtopic; answers the main question in the first screen

**Helpfulness and E-E-A-T**
- Contains first-hand evidence: real screenshots, real numbers, real photos, named people
- Says who is behind it, with contact details; prices or a price range in EGP
- Nothing a generic AI answer would already say better; has a clear unique angle
- Accurate and dated where facts can age

**Technical**
- Indexed (Search Console URL inspection), self-canonical, in sitemap, no `noindex`
- Correct `lang`/`dir`, `hreflang` pairs if bilingual
- Mobile LCP under 2.5 s, CLS under 0.1, INP under 200 ms (PageSpeed Insights field data when available)
- Structured data valid (Rich Results Test) and matches visible content
- At least 3 relevant internal links in, descriptive anchors

**Conversion**
- One primary CTA above the fold on mobile; WhatsApp and phone visible
- Proof near the CTA (testimonial, client logo, number)

The audit ends with a prioritised fix list: highest impact first, each fix tied to the evidence
that motivated it.

## 6. Measuring afterwards

Baseline the page in Search Console before changing it (impressions, clicks, position for the
cluster's queries, country Egypt). Re-measure at 4 and 12 weeks. Record results in a new dated
file; never edit a baseline.
