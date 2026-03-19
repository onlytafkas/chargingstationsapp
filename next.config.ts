import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_SERVER === "true" ? ".next-e2e" : ".next",
};

export default nextConfig;
