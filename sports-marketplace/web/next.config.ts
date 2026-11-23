import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Listings are posted with up to 8 compressed photos.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
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
