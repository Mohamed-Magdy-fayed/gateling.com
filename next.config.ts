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
};

export default nextConfig;
