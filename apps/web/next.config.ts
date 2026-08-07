import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile TypeScript source from shared workspace packages (npm workspaces).
  transpilePackages: ["@ajac/ui", "@ajac/types"],
  // @react-pdf/renderer ships ESM + node bindings; let Node load it directly
  // instead of letting Turbopack bundle it into route handlers.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;