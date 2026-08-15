# SEO Blueprint

SEO requirements for every public page on gateling.com.

## Metadata Rules

Every public page (`(landing-pages)`) must export either:
- `export const metadata: Metadata = { ... }` (static pages)
- `export async function generateMetadata(): Promise<Metadata>` (dynamic routes)

Always use the title template in root layout: `%s | Gateling Solutions`
Never hardcode ` | Gateling Solutions` in a per-page title.

### `buildMetadata()` is the only entry point

Build that object with `buildMetadata()` from `src/lib/seo.ts` — do not hand-roll
one. It derives the canonical and `og:url` from a single `path`, and emits the
full `openGraph` and `twitter` blocks that 13 of 16 pages were missing before
Phase 2.

```ts
export const metadata: Metadata = buildMetadata({
  title: "About — Custom Software Specialists in Egypt & MENA",
  description: "…",
  path: "/about",
});
```

`image` takes an absolute URL or a `public/` path; `type: "article"` unlocks
`publishedTime`/`modifiedTime`/`authors`; `noindex: true` emits
`noindex, nofollow` for private or token-gated routes. For content records, pass
`featuredImage(record.media, record.coverImageUrl)` rather than re-inlining the
featured-image lookup.

The same module owns the JSON-LD entity ids — `ORG_ID`, `WEBSITE_ID`,
`FOUNDER_ID`, and the `ORG_REF` shorthand. **Never write
`"https://gateling.com/#org"` as a literal.** It was hardcoded in seven files;
under the local `BASE_URL` those ids do not match the layout's, so the graph
silently breaks in exactly the environment the e2e suite runs in.

## Per-Page SEO Targets

> **Titles below exclude the brand.** The root template appends
> ` | Gateling Solutions` to every page title. Writing the brand into a page
> title yields "… | Gateling Solutions | Gateling Solutions". Only the root
> layout's `title.default` carries the brand itself.

### Homepage `/`
- **Title:** `Custom Software Development & Business Automation`
- **Description:** `Custom software and business automation for growing businesses in Egypt & MENA. We build platforms that clear manual chaos and put every decision on live data.`
- **Primary keyword:** `custom software development Egypt`
- **Secondary:** `business automation MENA`, `software for cafes schools retail`
- **H1:** `Custom software that works the way your business works`
- The H1 is assembled from two spans (`hero.headlinePart1` + `headlinePart2`) in
  `_components/hero-section.tsx`. Keep the primary keyword in part 1, and keep the
  explicit `{" "}` between the spans — without it the rendered text content runs
  the two halves together into one unreadable string.

### Services `/services`
- **Title:** `Custom Software & Business Automation Services | Gateling Solutions`
- **Description:** `Custom software development, process automation, and AI integration for restaurants, schools, retail, and events. Free 30-min consultation. Egypt & MENA.`
- **Primary keyword:** `business process automation`
- **Secondary:** `custom ERP Egypt`, `AI integration for business`, `workflow automation software`
- **H1:** `Full-Stack Business Solutions — From Custom Apps to AI Automation`

### Service Detail `/services/[slug]`
- **Title:** Service `title` (uses the root template: `[title] | Gateling Solutions`)
- **Description:** Service `shortDescription`
- **OG image:** featured `service_media` row, falling back to `coverImageUrl`
- **H1:** Service `title`
- Body copy comes from `services.fullDescription` — plain text, blank line between
  paragraphs, split on render. A row with a NULL `fullDescription` falls back to
  `shortDescription`, which is far too thin to rank: backfill it via
  `npm run seed -- service-pages` or the admin CMS.
- Curated internal links per slug live in
  `src/app/(landing-pages)/services/_service-links.ts`. Only published slugs may
  be listed; an unresolved one is dropped from the page and logged.
- Live slugs: `custom-software-development`, `business-process-automation`,
  `ai-integration`, `digital-transformation-consulting`, `web-app-development`,
  `dashboards-and-reporting`, `system-integrations`.
- An unknown slug returns a real **HTTP 404** as of Phase 1.5, via the slug check
  in `src/proxy.ts`. See the soft-404 section below.

### Work (case studies) `/work`
- **Title:** `Case Studies — Real Results for Real Businesses | Gateling Solutions`
- **Description:** `See how we helped a cafe automate callouts, a school digitize enrollment, and an atelier manage multi-branch rentals. Real impact, measurable results.`
- **Primary keyword:** `custom software case studies`
- **Secondary:** `cafe management automation`, `school ERP Egypt`
- **H1:** `Work We've Built — Real Results for Real Businesses`

### Case Study Detail `/work/[slug]`
- **Title:** the case study `title` verbatim (the root template appends the brand)
- **Description:** `results.summary`, falling back to the first 155 chars of `problemStatement`
- **OG image:** featured `case_study_media` row, falling back to `coverImageUrl`
- The `title` column already follows the `[Client]: [Key Result]` pattern below,
  so the page must **not** append `cs.client` to it. Doing so rendered
  "Atelier Alaa El-Kasry: 70% Less Admin Time — Atelier Alaa El-Kasry"; fixed in
  Phase 2.

### Blog `/blog`
- **Title:** `Blog — Business Automation & Custom Software Insights | Gateling Solutions`
- **Description:** `Insights on automating your business, building custom software, and integrating AI. For growing businesses in Egypt and MENA.`
- **Primary keyword:** `business automation guide`
- **H1:** `Insights on Building Software That Actually Matters`

### Blog Post `/blog/[slug]`
- **Title:** Post title (uses template: `[post title] | Gateling Solutions`)
- **Description:** Post `excerpt`
- **OG image:** Post `coverImageUrl`

### About `/about`
- **Title:** `About Gateling Solutions — Custom Software Specialists, Egypt & MENA`
- **Description:** `Custom software specialists helping businesses across Egypt and MENA automate operations, integrate AI, and scale with purpose-built technology systems.`
- **Primary keyword:** `software development company MENA`
- **H1:** `We Build Software That Solves Real Business Problems`

### Contact `/contact`
- **Title:** `Get a Free Consultation — Custom Software & Automation | Gateling Solutions`
- **Description:** `Tell us your biggest business problem. We'll design a custom solution and give you a free 30-minute consultation. Egypt, MENA & worldwide.`
- **H1:** `Let's Build Your Next Competitive Advantage`

### ROI Calculator `/tools/roi-calculator` — removed in Phase 2

The page shipped roughly 60 words of prose around an interactive widget: one
H1, a 22-word lead, a CTA heading, and no body copy, methodology, FAQ, or
internal links beyond `/contact`. There was nothing on it to rank for, and
filling it out would have meant writing a page's worth of copy for a tool with
no search demand behind it.

The calculator itself survives as the `roi_embed` content block
(`src/components/blocks/roi-calculator.tsx`), which is where it earns its keep —
embedded inside an article or case study that already ranks. The retired URL
**308s to `/services`** via `next.config.ts`, because it had been advertised in
the sitemap and crawled; deleting it outright would have added to the "Not
found (404)" count instead of passing its signals on.

## JSON-LD Schemas

### Root Layout (all pages)

Shipped as of Phase 2. Every value is derived from `BASE_URL` and
`src/lib/company.ts` — nothing below is a literal in the source.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://gateling.com/#org",
  "name": "Gateling Solutions",
  "url": "https://gateling.com",
  "logo": "https://gateling.com/logo.png",
  "email": "info@gateling.com",
  "telephone": "+201123862218",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Cairo",
    "addressCountry": "EG"
  },
  "areaServed": [
    { "@type": "Country", "name": "Egypt" },
    { "@type": "Place", "name": "Middle East and North Africa" }
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "info@gateling.com",
    "telephone": "+201123862218",
    "availableLanguage": ["en", "ar"]
  },
  "founder": { "@id": "https://gateling.com/about#founder" },
  "sameAs": [
    "https://www.facebook.com/GatelingSolutions/",
    "https://www.youtube.com/@gatelingsolutions",
    "https://www.instagram.com/gatelingsolutions/"
  ]
}
```

> **`sameAs` must only list profiles that exist.** An earlier draft of this
> document proposed `linkedin.com/company/gateling` and `github.com/gateling`.
> Neither exists — they were aspirational, and shipping them would have pointed
> Google at 404s. The three above were verified to resolve on 2026-08-14, and
> the YouTube channel was confirmed via oEmbed on the intro video. There is no
> company LinkedIn page; the founder's personal LinkedIn lives on the Person
> node instead, which is where it belongs.
>
> `src/lib/company.ts` is the single source for these. The footer renders the
> same constants, so the rendered links and the graph cannot drift apart. Before
> Phase 2 the footer's YouTube link 404'd and its Facebook/Instagram pointed at
> personal accounts.

> **Resolved — the `logo` defect.** The layout shipped `logo: "favicon.ico"`, a
> *relative* URL that structured-data consumers resolve against the current
> page, so on `/blog/<slug>` it requested `/blog/favicon.ico` and 404'd. Fixed
> in Phase 2 to `absoluteUrl("/logo.png")`. Guarded by the
> "logo is an absolute raster URL that resolves" test in `e2e/seo.spec.ts`.

> **The homepage no longer emits a second Organization node.**
> `_components/testimonials-section.tsx` used to declare `Organization` again,
> reusing the same `@id` and attaching `aggregateRating` + `review[]` built from
> our own testimonials. Self-serving review markup about the entity that
> controls the page is against Google's review-snippet policy, and it left the
> entity defined in two places. The markup is gone; the testimonials still
> render.

### Person (`/about`)

Emitted by `about/_components/founder-section.tsx`, which already holds the
name, role and bio. The Organization's `founder` points at this `@id`.

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://gateling.com/about#founder",
  "name": "Mohamed Magdy",
  "jobTitle": "Founder & CEO, Gateling Solutions",
  "url": "https://gateling.com/about",
  "worksFor": { "@id": "https://gateling.com/#org" },
  "sameAs": ["https://www.linkedin.com/in/mohamed-magdy-fayed/"]
}
```

Icons come from `metadata.icons` pointing at `public/favicon.ico`. The generated
`src/app/icon.tsx` that Phase 0 added was removed in favour of the real file.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gateling Solutions",
  "url": "https://gateling.com"
}
```

### Case Study Detail Page

`Article` as of Phase 2 — it was `CreativeWork`, which is too abstract to earn
any rich result. `headline` is clamped to 110 characters via `clampHeadline()`;
Google truncates past that and flags it in the Rich Results Test.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[case study title, ≤110 chars]",
  "description": "[results.summary or problemStatement]",
  "image": "[featured media or coverImageUrl]",
  "url": "https://gateling.com/work/[slug]",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "[url]" },
  "inLanguage": "en",
  "datePublished": "[publishedAt]",
  "dateModified": "[updatedAt]",
  "author": { "@id": "https://gateling.com/#org" },
  "publisher": { "@id": "https://gateling.com/#org" }
}
```

The testimonials that used to hang off this node as `review[]` were removed.
They are reviews of Gateling, not of the article, and the same self-serving
review-markup policy applies. Dates are omitted rather than defaulted when the
row has no `publishedAt` — a fabricated date is worse than a missing one.

### Blog Post Detail Page

Same `Article` schema as case study.

## Soft 404s on content detail routes — fixed in Phase 1.5

**Resolved 2026-08-14.** `/blog/[slug]`, `/work/[slug]` and `/services/[slug]` now
return a real **HTTP 404** for an unknown slug.

### Root cause

Not the locale cookie, and not the root Suspense boundary specifically. It is inherent
to streaming, and Next documents it directly
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`,
"Status Codes"):

> Because the response headers have already been sent to the client, the status code of
> the response cannot be updated. […] The response body starts streaming when a Suspense
> fallback renders […] or when a Server Component suspends under a `Suspense` boundary.
> Place `notFound()` before those boundaries and before any `await` that may suspend.

Every one of these routes awaits a database lookup before it can know the slug is
unknown. Under `cacheComponents: true` that await **must** sit inside a Suspense
boundary or the build fails with *"Uncached data was accessed outside of `<Suspense>`"*.
So the body has always begun streaming by the time `notFound()` runs, and the status is
already committed to 200.

Removing the root Suspense does not help: at least three dynamic dependencies sit above
`notFound()` — `getLocaleCookie()` in `src/app/layout.tsx`, the page's own slug lookup,
and `getCachedAuth()` + `getPublicTrackingSettings()` inside `Providers`, which renders
`{children}`. Removing only the first leaves the other two.

Attempts that were tried and do not work: `notFound()` in `generateMetadata`;
`await connection()` in the page or the layout; resolving the slug at the page top
level. `export const dynamic = "force-dynamic"` is rejected outright by `cacheComponents`.

### Mitigation that already existed

Next injects `<meta name="robots" content="noindex">` into a streamed not-found
response, and its docs state this "does not lead to indexation". The 2026-08-14
baseline recorded **zero** soft 404s in Search Console. The defect was real but its
SEO cost was small — worth knowing before spending on it again.

### The fix

`src/proxy.ts` resolves the slug **before rendering starts** and, when it is definitely
absent, rewrites to the not-found route with an explicit 404:

```ts
NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 })
```

Rewriting rather than returning a bare response preserves the URL, the styled
not-found page, and the automatic `noindex` tag.

`src/lib/published-slug.ts` holds the lookup. Points that matter if you touch it:

- It re-implements each route's publication filter in raw SQL. **If it drifts from the
  tRPC procedure it mirrors, the proxy will 404 a live page.** The
  `every sitemap content URL still returns 200` test in `e2e/seo.spec.ts` is the guard.
- Physical column names are quoted camelCase (`"deletedAt"`, `"isActive"`) — drizzle-kit
  generates this schema with no `casing` option.
- It **fails open**: any error or timeout returns `null`, and the proxy renders the page
  normally. A false 404 on live content is far worse than a soft 404.
- The timeout is a hang-guard (5s), not a latency budget. A tight budget makes the first
  request to every cold instance fall open and serve the soft 404 this exists to remove.
- The pool is deliberately not `max: 1`; that measured 5.8s under 20 concurrent requests
  because every content request serializes through it.

The check is wired into the existing auth proxy and only ever applies to a pass-through
response, so an auth redirect or an `/unauthorized` rewrite still wins over a 404.

## Sitemap (`src/app/sitemap.ts`)

Static routes: `/`, `/services`, `/work`, `/blog`, `/about`, `/contact`,
`/solutions`, `/privacy`, `/terms`

Dynamic routes:
- Every vertical in `src/app/(landing-pages)/solutions/_solutions.ts` → `/solutions/<slug>`
- All active services: `/services/[slug]` with `lastModified: updatedAt`
- All published case studies: `/work/[slug]` with `lastModified: updatedAt`
- All published blog posts: `/blog/[slug]` with `lastModified: updatedAt`

Do NOT include admin routes, auth routes, or customer portal.

## robots.ts

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /leads
Disallow: /subscribers
Disallow: /blog-posts
Disallow: /work-mgmt
Disallow: /services-mgmt
Disallow: /testimonials
Disallow: /users
Disallow: /branches
Disallow: /settings
Disallow: /api/
Sitemap: https://gateling.com/sitemap.xml
```

## Canonical URLs

Use `src/app/layout.tsx` `metadataBase` to resolve relative OG images:
```ts
metadataBase: new URL(process.env.BASE_URL ?? "https://gateling.com")
```

## Arabic SEO

Arabic meta descriptions for key pages use these keywords:
- `تطوير برمجيات مخصصة` (custom software development)
- `أتمتة الأعمال` (business automation)
- `حلول تقنية للمطاعم والمدارس` (tech solutions for restaurants and schools)
- `استشارات ذكاء اصطناعي` (AI consulting)

When Arabic locale is active, serve Arabic metadata from the i18n system.

## Case Study Headline Pattern

Case study H1 must follow this pattern for maximum SEO impact:
`[Client Name]: [Key Result in 5-7 Words]`

Examples:
- "Atelier Alaa El-Kasry: 70% Less Admin Time Across 2 Branches"
- "Gateling Cafe: Zero Missed Callouts With AI Announcements"
- "Megz Courses: Full Lead-to-Student Pipeline Digitized"
