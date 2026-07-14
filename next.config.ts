import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
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
