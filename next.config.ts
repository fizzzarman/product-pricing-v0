import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Live retailers (see src/adapters/scraper/presets.ts). next/image throws
      // for unlisted hosts, so add each new retailer's image host here.
      { protocol: "https", hostname: "startech.com.bd" },
      { protocol: "https", hostname: "**.startech.com.bd" },
      { protocol: "https", hostname: "ryans.com" },
      { protocol: "https", hostname: "**.ryans.com" },
      { protocol: "https", hostname: "dazzle.com.bd" },
      { protocol: "https", hostname: "**.dazzle.com.bd" },
    ],
  },
};

export default nextConfig;
