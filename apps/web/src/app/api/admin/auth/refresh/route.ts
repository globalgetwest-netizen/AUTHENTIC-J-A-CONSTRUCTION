import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  getApiBase,
  getRefreshToken,
  setAuthCookies,
} from "@/lib/admin/auth";

interface RefreshBody {
  accessToken: string;
  refreshToken: string;
}

export async function POST(): Promise<NextResponse> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const apiBase = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { message: "The admin service is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!res.ok) {
    await clearAuthCookies();
    return NextResponse.json({ message: "Session expired. Sign in again." }, { status: 401 });
  }

  const data = (await res.json()) as RefreshBody;
  await setAuthCookies(data.accessToken, data.refreshToken);

  return NextResponse.json({ ok: true }, { status: 200 });
}