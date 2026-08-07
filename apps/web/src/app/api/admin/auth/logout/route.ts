import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getApiBase,
  getBearer,
  getRefreshToken,
} from "@/lib/admin/auth";

export async function POST(): Promise<NextResponse> {
  const apiBase = getApiBase();
  const refreshToken = await getRefreshToken();
  const bearer = await getBearer();

  // Revoke the session server-side when we can, but always clear local cookies.
  if (refreshToken) {
    try {
      await fetch(`${apiBase}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...bearer,
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // Session will expire on its own; cookies below are still cleared.
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true }, { status: 200 });
}