# SEO Blueprint

SEO requirements for every public page on gateling.com.

## Metadata Rules

Every public page (`(landing-pages)`) must export either:
- `export const metadata: Metadata = { ... }` (static pages)
- `export async function generateMetadata(): Promise<Metadata>` (dynamic routes)

Always use the title template in root layout: `%s | Gateling Solutions`
Never hardcode ` | Gateling Solutions` in a per-page title.

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
- **Title:** `[client]: [key result] | Gateling Solutions`
- **Description:** First 155 chars of `problemStatement`
- **OG image:** `coverImageUrl`

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

### ROI Calculator `/tools/roi-calculator`
- **Title:** `Business Automation ROI Calculator — How Much Is Manual Work Costing You?`
- **Description:** `Calculate how much time and money your team loses to manual processes. See your potential savings with business automation. Free calculator.`
- **H1:** `How Much Is Manual Work Costing Your Business?`

## JSON-LD Schemas

### Root Layout (all pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gateling Solutions",
  "url": "https://gateling.com",
  "logo": "https://gateling.com/logo.png",
  "email": "info@gateling.com",
  "sameAs": [
    "https://linkedin.com/company/gateling",
    "https://github.com/gateling"
  ]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Gateling Solutions",
  "url": "https://gateling.com"
}
```

### Case Study Detail Page

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[case study title]",
  "description": "[problemStatement]",
  "image": "[coverImageUrl]",
  "datePublished": "[publishedAt]",
  "publisher": {
    "@type": "Organization",
    "name": "Gateling Solutions",
    "url": "https://gateling.com"
  }
}
```

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
`/tools/roi-calculator`, `/solutions`, `/privacy`, `/terms`

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
