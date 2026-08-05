import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile TypeScript source from shared workspace packages (npm workspaces).
  transpilePackages: ["@ajac/ui", "@ajac/types"],
};

export default nextConfig;