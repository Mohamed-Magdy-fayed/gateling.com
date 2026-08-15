import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/json-ld";

/**
 * The one place page metadata is assembled.
 *
 * Before this helper, 13 of 16 public pages shipped a title, a description and
 * a canonical and nothing else — no `openGraph`, no `twitter` — so every share
 * preview fell back to the site-wide defaults in `src/app/layout.tsx`. The
 * three `[slug]` routes that did build them had drifted apart: `/work/[slug]`
 * had no `twitter` block at all and no `og:url`, and each route carried its own
 * copy of the same featured-image lookup.
 *
 * Titles must NOT include the brand. The root layout's `title.template`
 * appends " | Gateling Solutions"; writing it here yields it twice.
 */
export type BuildMetadataInput = {
  title: string;
  description: string;
  /** Site-relative path, e.g. `/about`. Drives both canonical and `og:url`. */
  path: string;
  /** Absolute URL, or site-relative for assets in `public/`. */
  image?: string | null;
  type?: "website" | "article";
  /** ISO 8601. `article` only — ignored otherwise. */
  publishedTime?: string;
  /** ISO 8601. `article` only — ignored otherwise. */
  modifiedTime?: string;
  /** `article` only — ignored otherwise. */
  authors?: string[];
  /** Private or token-gated pages. Emits `noindex, nofollow`. */
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  noindex = false,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      title,
      description,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(type === "article"
        ? {
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(authors?.length ? { authors } : {}),
          }
        : {}),
    },
    twitter: {
      // A `summary_large_image` card with no image renders as a bare link on
      // X, which is worse than the small card the text-only variant gives.
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Featured image for a content record, falling back to its cover.
 *
 * Identical logic was inlined in `/blog/[slug]`, `/work/[slug]` and
 * `/services/[slug]`, each of which then repeated it a second time for the
 * JSON-LD `image`.
 */
export function featuredImage(
  media: { url: string; isFeatured?: boolean | null }[] | null | undefined,
  fallback?: string | null,
): string | undefined {
  return media?.find((item) => item.isFeatured)?.url ?? fallback ?? undefined;
}

/**
 * Stable identifiers for the entities in the site-wide JSON-LD graph.
 *
 * These were hardcoded as the literal `"https://gateling.com/#org"` in the root
 * layout and six page files. Deriving them from `BASE_URL` keeps every node
 * pointing at the same entity in every environment — the local `.env` sets
 * `BASE_URL="http://localhost:3000/"`, which is where the e2e suite runs, so a
 * mix of hardcoded and derived ids would silently break the graph exactly
 * where it is tested.
 */
export const ORG_ID = absoluteUrl("/#org");
export const WEBSITE_ID = absoluteUrl("/#website");
/** The founder Person, defined in full on `/about`. */
export const FOUNDER_ID = absoluteUrl("/about#founder");

/** Reference to the Organization node, for `publisher`/`provider`/`author`. */
export const ORG_REF = { "@id": ORG_ID } as const;

/**
 * Google truncates `headline` past ~110 characters and flags longer values in
 * the Rich Results Test.
 */
export function clampHeadline(text: string, max = 110): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
