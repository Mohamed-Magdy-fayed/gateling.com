import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // viewTransition was enabled here but broke hydration for content
    // revealed through a Suspense boundary (e.g. blog/work pages) — visible
    // DOM shipped with no React fiber attached, i.e. permanently inert.
    // Next.js's own docs mark this feature "not recommended for production".
    // Turbopack's persistent dev cache grows unbounded (multi-GB .sst files
    // in .next/dev/cache/turbopack) and adds heavy disk writes on every save.
    turbopackFileSystemCacheForDev: false,
  },
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "/uploads/images/:path*",
      },
    ];
  },
  async redirects() {
    return [
      // The ROI calculator page was removed in SEO Phase 2 — ~60 words of prose
      // around a widget, with nothing to rank for. It had been advertised in
      // the sitemap and crawled, so deleting it outright would add to the
      // "Not found (404)" count in Search Console instead of passing its
      // signals on. `permanent: true` emits a 308, which Google treats as a 301.
      //
      // Note this works only because it is a *path* redirect inside the app.
      // The www -> non-www redirect cannot be done here: Vercel resolves domain
      // redirects before the request reaches Next, so a `has: [{ type: "host" }]`
      // rule would never fire. See docs/seo-program.md.
      {
        source: "/tools/roi-calculator",
        destination: "/services",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
