import type { MetadataRoute } from "next";

import { SOLUTION_VERTICALS } from "@/app/(landing-pages)/solutions/_solutions";
import { api } from "@/integrations/trpc/server";
import { absoluteUrl } from "@/lib/json-ld";

/**
 * Public route set only. CMS/(system-pages), API, and token-gated routes
 * (/feedback/:slug) are never enumerated here. Case studies and blog posts
 * come from the `public*` tRPC procedures, which already filter to
 * `status = "published"` and `deletedAt IS NULL`, so drafts stay out.
 */
type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

const staticRoute = (
  path: string,
  changeFrequency: ChangeFrequency,
  priority: number,
): SitemapEntry => ({
  url: absoluteUrl(path),
  lastModified: new Date(),
  changeFrequency,
  priority,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    staticRoute("/", "weekly", 1),
    staticRoute("/services", "monthly", 0.9),
    staticRoute("/work", "weekly", 0.9),
    staticRoute("/blog", "weekly", 0.8),
    staticRoute("/about", "monthly", 0.7),
    staticRoute("/contact", "monthly", 0.8),
    staticRoute("/tools/roi-calculator", "monthly", 0.7),
    staticRoute("/solutions", "monthly", 0.7),
    // Driven off the registry so a new vertical can't ship without a sitemap
    // entry — see `src/app/(landing-pages)/solutions/_solutions.ts`.
    ...SOLUTION_VERTICALS.map((vertical) =>
      staticRoute(`/solutions/${vertical.slug}`, "monthly", 0.8),
    ),
    staticRoute("/privacy", "yearly", 0.3),
    staticRoute("/terms", "yearly", 0.3),
  ];

  const caller = await api();

  const [caseStudiesResult, blogPostsResult] = await Promise.allSettled([
    caller.caseStudies.publicList(),
    caller.blogPosts.publicList(),
  ]);

  const caseStudyRoutes: MetadataRoute.Sitemap =
    caseStudiesResult.status === "fulfilled"
      ? caseStudiesResult.value.map((cs) => ({
          url: absoluteUrl(`/work/${cs.slug}`),
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }))
      : [];

  const blogRoutes: MetadataRoute.Sitemap =
    blogPostsResult.status === "fulfilled"
      ? blogPostsResult.value.map((post) => ({
          url: absoluteUrl(`/blog/${post.slug}`),
          lastModified: post.publishedAt
            ? new Date(post.publishedAt)
            : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...caseStudyRoutes, ...blogRoutes];
}
