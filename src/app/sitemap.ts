import type { MetadataRoute } from "next";

import { api } from "@/integrations/trpc/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BASE_URL ?? "https://gateling.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/work`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/tools/roi-calculator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const caller = await api();

  const [caseStudiesResult, blogPostsResult] = await Promise.allSettled([
    caller.caseStudies.publicList(),
    caller.blogPosts.publicList(),
  ]);

  const caseStudyRoutes: MetadataRoute.Sitemap =
    caseStudiesResult.status === "fulfilled"
      ? caseStudiesResult.value.map((cs) => ({
          url: `${base}/work/${cs.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.8,
        }))
      : [];

  const blogRoutes: MetadataRoute.Sitemap =
    blogPostsResult.status === "fulfilled"
      ? blogPostsResult.value.map((post) => ({
          url: `${base}/blog/${post.slug}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...caseStudyRoutes, ...blogRoutes];
}
