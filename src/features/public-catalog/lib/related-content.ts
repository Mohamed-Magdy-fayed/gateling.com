import "server-only";

import type { RelatedContentItem } from "@/components/general/related-content";
import type { api } from "@/integrations/trpc/server";

type Caller = Awaited<ReturnType<typeof api>>;

/** Longest description rendered in a related-content card before ellipsis. */
const MAX_DESCRIPTION_CHARS = 180;

function truncate(text: string): string {
  const clean = text.trim();
  if (clean.length <= MAX_DESCRIPTION_CHARS) return clean;
  const cut = clean.slice(0, MAX_DESCRIPTION_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * A related block must never link a slug that 404s, so an unresolved row is
 * dropped from the list rather than rendered. That silently shrinks the section,
 * which is easy to miss in production — log it instead.
 *
 * The most common cause is a slug in a registry pointing at a row that is still
 * a draft, was soft-deleted, or was renamed.
 */
function warnUnresolved(context: string, slug: string): void {
  console.warn(
    `[related-content] ${context}: "${slug}" did not resolve — it is missing, ` +
      `soft-deleted, or not published. It will not be linked.`,
  );
}

/**
 * Resolve published case studies by slug, in the order given, into cards.
 * Slugs that do not resolve are skipped.
 */
export async function resolveRelatedCaseStudies(
  caller: Caller,
  slugs: readonly string[],
  context: string,
): Promise<RelatedContentItem[]> {
  const rows = await Promise.all(
    slugs.map((slug) =>
      caller.caseStudies.publicGetBySlug({ slug }).catch(() => null),
    ),
  );

  const items: RelatedContentItem[] = [];
  for (const [index, row] of rows.entries()) {
    const slug = slugs[index];
    if (!row) {
      if (slug) warnUnresolved(context, slug);
      continue;
    }
    items.push({
      href: `/work/${row.slug}`,
      title: row.title,
      description: truncate(row.results.summary || row.problemStatement),
      eyebrow: row.industry,
    });
  }
  return items;
}

/**
 * Resolve published blog posts by slug, in the order given, into cards.
 * Slugs that do not resolve are skipped.
 */
export async function resolveRelatedArticles(
  caller: Caller,
  slugs: readonly string[],
  locale: string,
  context: string,
): Promise<RelatedContentItem[]> {
  const rows = await Promise.all(
    slugs.map((slug) =>
      caller.blogPosts.publicGetBySlug({ slug }).catch(() => null),
    ),
  );

  const items: RelatedContentItem[] = [];
  for (const [index, row] of rows.entries()) {
    const slug = slugs[index];
    if (!row) {
      if (slug) warnUnresolved(context, slug);
      continue;
    }
    const tags = locale === "ar" && row.tagsAr?.length ? row.tagsAr : row.tags;
    items.push({
      href: `/blog/${row.slug}`,
      title: locale === "ar" ? (row.titleAr ?? row.title) : row.title,
      description: truncate(
        locale === "ar" ? (row.excerptAr ?? row.excerpt) : row.excerpt,
      ),
      eyebrow: tags?.[0],
    });
  }
  return items;
}
