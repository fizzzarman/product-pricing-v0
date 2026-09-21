import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Add real retailer image CDNs here as adapters go live, e.g.:
      // { protocol: "https", hostname: "www.startech.com.bd" },
    ],
  },
};

export default nextConfig;
