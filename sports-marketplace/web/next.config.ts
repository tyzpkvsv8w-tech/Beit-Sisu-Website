import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Listings are posted with up to 8 compressed photos.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
      {
        // The service worker must never be cached, or app updates wouldn't reach phones.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
