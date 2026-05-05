import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://tiktokshop-trends-production.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;