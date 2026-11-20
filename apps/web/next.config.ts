import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@partyverse/shared"],
  reactStrictMode: true,
};

export default nextConfig;
