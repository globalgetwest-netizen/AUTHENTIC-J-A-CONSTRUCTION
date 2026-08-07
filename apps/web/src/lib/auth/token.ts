/**
 * Lightweight JWT payload reader used by the Next.js route guards to bucket the
 * signed-in user into a portal (admin vs staff). We decode only the token's
 * claims for routing; validation and permission enforcement happen server-side
 * in the API, so a forged/expired token here is still rejected downstream.
 */
export function decodeAccessTokenRoles(token: string): string[] | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1] ?? "", "base64url").toString("utf8"),
    ) as { roles?: string[] };
    return Array.isArray(payload.roles) ? payload.roles : null;
  } catch {
    return null;
  }
}