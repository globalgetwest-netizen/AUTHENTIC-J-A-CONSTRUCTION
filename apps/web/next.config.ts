import type { NextConfig } from "next";

/**
 * Baseline security headers for the public site + admin portals. No CSP here:
 * the app loads many inline scripts/styles and a strict policy would need a
 * full nonce/hash inventory — deferred to production hardening. The other
 * headers are safe to set unconditionally.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Compile TypeScript source from shared workspace packages (npm workspaces).
  transpilePackages: ["@ajac/ui", "@ajac/types"],
  // @react-pdf/renderer ships ESM + node bindings; let Node load it directly
  // instead of letting Turbopack bundle it into route handlers.
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // HSTS is only meaningful once the site is served over HTTPS.
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
