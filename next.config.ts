import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
  process.env.npm_package_version ??
  Date.now().toString();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.openfoodfacts.org" },
      { protocol: "https", hostname: "static.openfoodfacts.org" },
      { protocol: "https", hostname: "world.openfoodfacts.org" },
    ],
  },
};

export default withSerwist(nextConfig);
