/**
 * BASE_URL is configured with a trailing slash in some environments
 * (e.g. `https://gateling.com/`). Strip it here so callers can join paths
 * with plain template strings without emitting `https://gateling.com//path`.
 */
const BASE_URL = (process.env.BASE_URL ?? "https://gateling.com").replace(
  /\/+$/,
  "",
);

/** Absolute, single-slash URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return new URL(path, BASE_URL).toString();
}

/** Canonical URL for a public page. Alias of {@link absoluteUrl}. */
export const canonicalUrl = absoluteUrl;

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}
