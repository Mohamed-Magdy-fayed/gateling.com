# SEO research: dress rental atelier management software

Run: 2026-11-26 · Market: EG · Languages: ar, en · Tier: M · Fidelity: **partial** (Keyword Planner blocked, no Search Console data, no social pass)
Raw captures: `.seo-research/dress-rental-atelier-software/2026-11-26/raw/` (local only, gitignored)

## Decisions for the owner

1. **Lift the English-only SEO rule for one Arabic page (recommended), or accept we can't rank here.**
   `docs/seo-program.md` says "English-only for SEO. No `/ar` routes". Every vendor page ranking
   for `برنامج اتيليه` and `برنامج ايجار فساتين` is Arabic, in Egyptian dialect, `lang=ar dir=rtl`
   (Atelo, XDressly, Atelih, DEXEF; SERP capture 2026-11-26). An English page cannot satisfy these
   queries. The Phase 1.5 locale plan ("Arabic tree `noindex` with English canonical") would also
   stop this page from ranking, so that settled decision needs reopening **for this page at least**:
   an indexable Arabic URL with a self-canonical and `hreflang` pair to the English page.
2. **Treat SEO as a support channel for this product, not the client engine.** Search demand for
   atelier software in Egypt is tiny (see Headline). Phone outreach (discovery sprint) stays the
   main way to win ateliers; the page's main job is to convert people who look us up, and to catch
   the few who search.
3. **Keyword Planner needs a real Google Ads customer account.** The signed-in session only has
   Manager accounts (`test_name` + two closed), so the planner shows "Please select an account".
   Creating a customer account (no spend needed) would give volume ranges on the next run.

## Headline

Atelier owners in Egypt barely search for software. Google Trends (EG, 5 years and 12 months,
captured 2026-11-26) shows `برنامج اتيليه`, `سيستم اتيليه` at 0 average with single-week blips,
and autocomplete returns nothing beyond the seed itself. Yet the results page is small and
contested by five funded vendors (Atelo, XDressly, Atelih, DEXEF, Bridalinn) with only 6-8
organic results, no ads and an AI Overview citing them. So: **cheap to rank, little to win from
ranking**. The one page worth building is a strong Arabic product page that matches what owners
actually feel (paper notebook, fittings, deposits, handover), plus its English twin. The bigger
search demand is upstream: people asking **how to open an atelier** (`ازاي افتح اتيليه فساتين`,
PAA "ما هي تكلفة مشروع أتيليه فساتين؟"), where Google's AI answer currently quotes **Saudi riyal**
costs: an open gap for an Egyptian, EGP-based guide.

## Keyword map

Opportunity score = value×3 + demand×2 + winnability×2 + click retention×1 + social×1 (max 45).

| # | Cluster (primary phrase) | Lang | Variants used on the page | Intent / page type | Demand (source, date) | Social 0-3 | AI Overview | Score | Target URL |
|---|---|---|---|---|---|---|---|---|---|
| 1 | برنامج اتيليه | ar | سيستم اتيليه، برنامج ايجار فساتين، برنامج ادارة محلات تأجير فساتين، برنامج حجز فساتين، أتيليه/اتيليه | Transactional: vendor product page | Trends EG avg 0 (5y, 12m), one blip of 84 in Jun 2024; autocomplete = seed only (2026-11-26). SERP has 5 vendors investing. | 2 (Koogi TV "برنامج أتيليه" videos Jun-Aug 2026; ThabetApps YT) | Yes, cites Atelo, Atelih, DEXEF, XDressly | 32 | **New** Arabic page, e.g. `/ar/solutions/atelier` (needs decision 1) |
| 2 | dress rental software | en | dress rental management system, clothing rental software, bridal shop software | Transactional: vendor page | Autocomplete: + "clothing rental software", "dress rental management system" (2026-11-26); no volume source | 1 | Yes, cites booqable, bridalinn, ucitco, rentbooks | 20 | **New** `/solutions/atelier` (English, allowed today) |
| 3 | ازاي افتح اتيليه فساتين | ar | مشروع اتيليه فساتين، مشروع ايجار فساتين، تكلفة مشروع اتيليه، هل مشروع الاتيليه مربح، دراسة جدوى اتيليه فساتين سواريه | Informational: guide | Trends: `ازاي افتح اتيليه` peak 38 (Feb 2024) vs `اتيليه فساتين` avg 26-36; 4 PAA questions; 3 related searches (2026-11-26) | 3 (Facebook group posts "عايزة افتح مشروع اتيليه فساتين هل هو مربح", TikTok/YT shorts on SERP) | Yes, answers in **SAR** from khalijhouse/reyiada | 26 | **New** Arabic article (`/write-article`), links to #1 |
| 4 | شيت اكسل حجز فساتين | ar | ملف اكسل اتيليه، دفتر حجز فساتين، برنامج لمحل ايجار فساتين بالاكسل | Tool download / lead magnet | Related search "ملف Excel جاهز لحسابات محل ملابس"; Khamsat sells an Excel VBA dress-rental file at rank 8 for #1 (2026-11-26) | 1 | n/a (not captured) | 24 | Later: free sheet download page linking to #1 |

## Clusters dropped and why

| Cluster | Reason |
|---|---|
| سيستم محل ملابس / برنامج كاشير محل ملابس | Real demand (autocomplete: مجانى، كاشير، سعر) but the buyer wants retail POS (sizes, barcode, cashier). 5 ads (Odoo, Daftra), Daftra/WaredPOS/Al-Badr own it. Wrong product. |
| ايجار فساتين سواريه / زفاف / اتيليه فساتين + area | Biggest demand (Trends `فساتين سواريه` avg 31-65) but these are brides, not our buyer. Opportunity for **our clients**: see note under brief #1. |
| atelier system / atelier app / atelier software (en) | Polluted by the Atelier video-game series and Italian "gestionale" software (autocomplete 2026-11-26). |
| برنامج مواعيد بروفات, تطبيق اتيليه, برنامج حسابات اتيليه | No autocomplete, no Trends data. Fold the words into page #1 instead. |

## Per cluster: what the ranking pages do

### 1. برنامج اتيليه / برنامج ايجار فساتين
- **Intent/source type:** vendor product pages (Atelo #1, XDressly, DEXEF, Atelih, Bridalinn) plus
  Play Store apps and a few Facebook videos. No ads. No PAA. Dominant type = Egyptian SaaS landing page.
- **Table stakes (in most vendor pages):** Arabic dialect copy; bookings with clash prevention; dress
  status (available/booked/out/maintenance); deposit (عربون) + insurance (تأمين) + balance (الباقي);
  customer records; monthly price in EGP (Atelo 299/599/999, XDressly 599 soiree / 1,199 bridal);
  free trial (XDressly 7 days no card, DEXEF 30 days); WhatsApp CTA; FAQPage schema.
- **Differentiators:** XDressly's one-day on-site onboarding (they photograph each dress), WhatsApp
  reminders sent from the atelier's own number, offline mode, a public website per atelier showing
  when a dress is free; Atelo's online store page per shop and permissions per employee.
- **Open gaps (our wording from discovery, Nov 2026):**
  - **Fittings (البروفات):** La Novia's owner called fitting times her biggest problem; brides keep
    asking. Only XDressly mentions fittings, in one line.
  - **Handover (التسليم والاستلام) and return guarantee:** Yara Style: "اغلب المشاكل في التسليم
    والاستلام"; La Novia takes a second person's phone number as guarantee. No page explains a
    return/guarantee flow (ID, guarantor, deposit held).
  - **Low-skill staff:** "البنات الي بتشتغل مستواها مش احسن حاجه". No page shows how simple the
    staff screen is.
  - **Moving from Excel:** owners on Excel (La Novia, 12 years, ~200 dresses). Our system has an
    `import` module; nobody promises "we import your Excel sheet".
- **Winnability:** high. 6-8 organic results, several weak (Bridalinn EN page ~150 words, DEXEF
  copy-pasted headings "محلات التسالي"). Atelo and XDressly are strong; we beat them on first-hand
  proof, not on length.

### 2. dress rental software (en)
Global SaaS (Booqable, Twice, RentalPoint, Rentopus) plus Gulf/Egypt vendors (Bridalinn, UCITCO,
UMTCO). "People also search for": free, download, best, event rental software. We will not
out-rank Booqable; the English page exists for prospects who read English and as the hreflang twin.

### 3. ازاي افتح اتيليه فساتين
- **Intent/source type:** informational. Facebook group questions rank #1 and #6; feasibility-study
  sellers (reyiada, mashroo3k, khalijhouse, scribd); short videos.
- **Table stakes:** startup cost, profit, pros/cons, how to start, rent vs sell, location.
- **Open gap:** no Egyptian, EGP-priced, first-hand answer. The AI answer quotes Saudi costs
  (80,000-300,000 SAR by size). Real numbers from owners we talk to (dress count, rental prices,
  deposits, seasons) would be non-commodity content Google says it rewards.
- **Click retention:** lower (AI Overview + PAA). Value is indirect: new atelier owners need a
  system from day one, and Lilly's owner says many young women are opening ateliers now.

## Page briefs

### Brief #1: Arabic product page (`برنامج اتيليه`) + English twin

- **Primary phrase:** `برنامج اتيليه` (title, H1, first paragraph). Secondary, used naturally:
  `سيستم اتيليه`، `برنامج ايجار فساتين`، `برنامج إدارة محلات تأجير الفساتين`، `أتيليه`. English
  twin: "Dress rental software for ateliers in Egypt".
- **Title (≤60):** `برنامج اتيليه لتأجير الفساتين: الحجز والبروفات والعربون | Gateling`
- **H1:** `برنامج اتيليه يمشي معاكي من الحجز لحد ما الفستان يرجع`
- **Meta description:** `سيستم اتيليه مصري لتأجير الفساتين: حجوزات من غير تعارض، مواعيد البروفات،
  العربون والتأمين والباقي، وتسليم واستلام مسجل. جربيه مجانًا وكلمينا على واتساب.`
- **Outline:**
  1. Hero: one line on the notebook/Excel problem, price from X EGP/month, WhatsApp CTA + trial.
  2. `الحجز من غير تعارض` (table stakes: calendar, dress status).
  3. `مواعيد البروفات` (gap: fitting schedule, reminders so brides stop asking).
  4. `التسليم والاستلام والضمان` (gap: pickup/return checklist, guarantor phone, ID, deposit).
  5. `العربون والتأمين والباقي` (payments module; daily cash close).
  6. `سهل على البنات في المحل` (gap: staff screen screenshot, roles).
  7. `بننقلك من الإكسل في يوم` (gap: import module).
  8. Prices in EGP and trial terms.
  9. FAQ (real questions): `البرنامج بكام في الشهر؟`، `ينفع على الموبايل؟`، `لو النت فصل؟`،
     `ينفع أكتر من فرع؟`، `بتنقلوا الشغل من الكشكول/الإكسل؟`، `هل في تجربة مجانية؟`.
- **First-hand material Megz must supply:** real screenshots of reservations, fittings, payments
  and staff screens (from a demo atelier, no client data); the confirmed monthly price and trial
  length; one named owner quote with permission (La Novia trial is the best candidate); a photo of
  a real rack/handover if a client agrees; branches/WhatsApp features only if they work today.
- **Internal links:** from `/solutions` (add the atelier vertical to `_solutions.ts`), homepage
  verticals, the `/work/atelier-alaa-el-kasry` case study, and article #3. Anchor: `برنامج اتيليه`.
- **Structured data:** SoftwareApplication with Offer in EGP (only real prices), FAQPage matching
  visible FAQ, BreadcrumbList. No AggregateRating (self-serving reviews, see Phase 2).
- **Conversion:** WhatsApp button above the fold on mobile + sticky; secondary "احجزي ديمو"
  (the `/atelier-demo` skill can make a branded demo per prospect).
- **Don't:** one page per spelling or per city; fake client counts (Atelo-style "+32%") unless we
  have them; mention features that don't exist.
- **Product note (not SEO for us):** XDressly and Atelo both sell a public website per atelier,
  because brides search `ايجار فساتين سواريه التجمع` etc. at real volume. That could be a selling
  point for the system; take it to discovery as a question, not a build.

### Brief #3: Arabic article `ازاي تفتح اتيليه تأجير فساتين في مصر`
For `/write-article`. Answer the PAA set (cost, profit, downsides, how to start) **in EGP** with
numbers from real Egyptian owners (ask permission; anonymise if needed): starting dress count,
rental price bands per type, deposit habits, seasons (summer weddings, Eid). Sections on rent vs
sell, location (upscale vs popular areas behave differently: discovery sprint), and running it
day to day (bookings, fittings, handover) with a soft link to page #1. No feasibility-study
copying. Write only once there are 3+ owners' real numbers.

## Page audits

No existing gateling.com page targets this niche (`/solutions` has only `delivery`), so there is
nothing to audit. `atelier.gateling.com` is the client app and stays `noindex` (decision of
2026-08-14 in `docs/seo-program.md`).

## Seasonality and timing

Software terms have too little data for seasonality. Consumer interest (`فساتين سواريه`,
`اتيليه فساتين`) peaks June-September with a smaller February/April lift (Trends EG 12m and 5y).
Owners are busiest then; publish page #1 before February 2027 and the article before April 2027.

## Measurement plan

No Search Console baseline exists for these queries (the property shows only 2 branded queries in
the Aug 2026 baseline). On launch, record impressions/position for the cluster #1 queries
(country Egypt), then re-check at 4 and 12 weeks in a new dated file. Also count WhatsApp clicks
from the page (pixel events).

## What was not checked

- **Keyword Planner:** blocked, no customer account (decision 3). No volumes anywhere in this report.
- **Search Console:** no data for this niche; no export requested.
- **Social pass:** Facebook groups, TikTok, Instagram, YouTube were not searched directly; only
  what appeared on Google SERPs. Atelih and Koogi TV pages were not captured.
- AI Overview text for `برنامج ايجار فساتين` and `سيستم محل ملابس` was still loading at capture;
  only cited domains recorded. SERPs were captured from the user's Chrome; Google may still
  personalise despite `pws=0`.
