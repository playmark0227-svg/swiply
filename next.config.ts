import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/swiply" : "",
  assetPrefix: isProd ? "/swiply/" : "",
  trailingSlash: true,
  // Pin the workspace root. A stray ~/package-lock.json otherwise makes Next
  // infer the home directory as the root, which breaks module resolution.
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
