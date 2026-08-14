/**
 * Registry of live vertical pillar pages under `/solutions`.
 *
 * Single source of truth for the `/solutions` index and `src/app/sitemap.ts`,
 * so adding a vertical is one entry here plus the page itself — not a second
 * edit to a hand-maintained sitemap array that is easy to forget.
 *
 * The i18n keys are written as literals (no template strings) and the array is
 * `as const`, so `t(vertical.titleKey)` stays type-checked: a typo or a missing
 * translation entry is a build error, not a key string rendered to the page.
 *
 * Only add a vertical once its page is built and the content it links to is
 * *published*. Pillar pages link live public URLs, not drafts — see the
 * "Solution Pillar Pages" section of `docs/portfolio-blueprint.md`.
 */
export const SOLUTION_VERTICALS = [
  {
    slug: "delivery",
    titleKey: "publicPages.solutionsIndexPage.deliveryTitle",
    descriptionKey: "publicPages.solutionsIndexPage.deliveryDescription",
  },
] as const;

export type SolutionVertical = (typeof SOLUTION_VERTICALS)[number];
