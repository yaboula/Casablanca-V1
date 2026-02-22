import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.wandaloo.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
