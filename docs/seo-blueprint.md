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
- **Known defect:** an unknown slug renders the 404 UI with HTTP 200, the same
  soft-404 issue `/blog/[slug]` and `/work/[slug]` have. See the soft-404 section
  below — one root cause, one fix, all three routes.

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

## Known issue: soft 404s on `/blog/[slug]` and `/work/[slug]`

**Unresolved as of 2026-08-14.** An unknown slug renders the 404 UI but responds
**HTTP 200**. Google classifies that as a soft 404: the URL is not indexed, but it
consumes crawl budget and shows up under *Pages → Soft 404* in Search Console.

Root cause — confirmed by experiment, not inferred:

- `src/app/layout.tsx` returns `<Suspense><Suspended>{children}</Suspended></Suspense>`,
  and `<html>`/`<body>` live *inside* `Suspended`. Every route therefore streams behind a
  Suspense boundary with an effectively empty shell.
- Next flushes that shell with `200` before any page code runs, so `notFound()` in the page
  body — or in `generateMetadata` — renders the right UI but can no longer set the status.
  A route that fails to *match* (e.g. `/totally-random-path`) still 404s correctly, because
  that decision happens before rendering.

Three fixes were tried and rejected:

| Attempt | Result |
|---|---|
| `notFound()` in `generateMetadata` instead of `return {}` | Still 200 — metadata streams too |
| `export const dynamic = "force-dynamic"` | Build error: *Route segment config "dynamic" is not compatible with `nextConfig.cacheComponents`* |
| `await connection()` in `generateMetadata` | Build passes, route stays `◐`, still 200 |

Removing the root Suspense *does* fix the status, but fails the build under
`cacheComponents`: `Uncached data was accessed outside of <Suspense>` — because
`Suspended` awaits `getLocaleCookie()`.

**The real fix** is to get the locale cookie read out of the root layout so `<html>`/`<body>`
can render outside any Suspense boundary. That has an Arabic UX tradeoff (`dir="rtl"` would
no longer be known at server-render time without another mechanism), so it needs its own
scoped change and a decision on how RTL is applied. Do not attempt it as a drive-by.

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
