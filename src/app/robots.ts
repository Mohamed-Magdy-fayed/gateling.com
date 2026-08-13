import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/json-ld";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private CMS, account, and API surfaces only. Public content routes
        // (/work, /work/:slug, /blog, /blog/:slug) must stay crawlable — a
        // `/work/` entry here previously blocked the live case studies.
        disallow: [
          "/dashboard",
          "/blog-posts",
          "/bookings",
          "/work-mgmt",
          "/services-mgmt",
          "/testimonials",
          "/leads",
          "/subscribers",
          "/users",
          "/branches",
          "/settings",
          "/api/",
          "/my-account",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
