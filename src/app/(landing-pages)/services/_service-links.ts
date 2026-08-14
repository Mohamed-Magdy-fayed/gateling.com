/**
 * Curated internal links for each `/services/[slug]` detail page.
 *
 * Phase 1 of the SEO program exists to fix thin internal linking — 19 URLs sat
 * at "Discovered – currently not indexed" in the 2026-08-14 baseline, which is
 * the signature of pages nothing links to. Every service page therefore links
 * out to the proof (case studies) and the reading (blog posts) that back it.
 *
 * This is a hand-curated registry rather than a database relation on purpose:
 * the association is an editorial judgement, and Phase 3 is where the SEO data
 * model and its admin surface land. Until then, one file is the source of truth
 * and a wrong slug is visible in review.
 *
 * **Only reference published slugs.** An unresolved slug is dropped from the
 * rendered section (and logged) by `resolveRelatedCaseStudies` /
 * `resolveRelatedArticles` — the page still renders, but the section shrinks.
 */
type ServiceLinks = {
  /** Case-study slugs — must exist and be `status = "published"`. */
  caseStudies: readonly string[];
  /** Blog-post slugs — must exist and be `status = "published"`. */
  articles: readonly string[];
};

export const SERVICE_LINKS: Record<string, ServiceLinks> = {
  "custom-software-development": {
    caseStudies: ["atelier-alaa-el-kasry", "megz-courses", "arabian-foods"],
    articles: [
      "custom-software-vs-off-the-shelf",
      "cloud-erp-vs-on-premise-egypt",
    ],
  },
  "business-process-automation": {
    caseStudies: ["megz-courses", "atelier-alaa-el-kasry"],
    articles: [
      "hidden-operational-bottlenecks",
      "automate-cafe-operations",
      "retail-inventory-automation-egypt",
    ],
  },
  "ai-integration": {
    caseStudies: ["lavida-jungle-play-cafe"],
    articles: ["automate-cafe-operations", "hidden-operational-bottlenecks"],
  },
  "digital-transformation-consulting": {
    caseStudies: ["megz-courses", "emanz"],
    articles: [
      "cloud-erp-vs-on-premise-egypt",
      "egypt-einvoicing-mandate",
      "hidden-operational-bottlenecks",
    ],
  },
  "web-app-development": {
    caseStudies: ["arabian-foods", "emanz", "ba2olak"],
    articles: [
      "custom-software-vs-off-the-shelf",
      "delivery-app-for-underserved-towns-egypt",
    ],
  },
  "dashboards-and-reporting": {
    caseStudies: ["megz-courses", "atelier-alaa-el-kasry"],
    articles: [
      "retail-inventory-automation-egypt",
      "hidden-operational-bottlenecks",
    ],
  },
  "system-integrations": {
    caseStudies: ["emanz", "ba2olak"],
    articles: ["egypt-einvoicing-mandate", "cloud-erp-vs-on-premise-egypt"],
  },
};

const NO_LINKS: ServiceLinks = { caseStudies: [], articles: [] };

/** Links for a service slug; empty lists for a service with no curation yet. */
export function serviceLinksFor(slug: string): ServiceLinks {
  return SERVICE_LINKS[slug] ?? NO_LINKS;
}
