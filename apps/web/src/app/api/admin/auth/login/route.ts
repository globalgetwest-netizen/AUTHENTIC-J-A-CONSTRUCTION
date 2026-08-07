import { NextResponse } from "next/server";
import { getApiBase, setAuthCookies } from "@/lib/admin/auth";
import type { AdminAuthUser } from "@/lib/admin/auth";

interface LoginBody {
  user: AdminAuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { message: "Could not read login details." },
      { status: 400 },
    );
  }

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    );
  }

  const apiBase = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return NextResponse.json(
      { message: "The admin service is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  const data = (await res.json().catch(() => null)) as (LoginBody & {
    message?: string;
  }) | null;

  if (!res.ok || !data?.user) {
    const message =
      res.status === 401
        ? "Incorrect email or password."
        : (data?.message ?? "Sign in failed. Try again.");
    return NextResponse.json({ message }, { status: res.status });
  }

  await setAuthCookies(data.accessToken, data.refreshToken);

  return NextResponse.json({ user: data.user }, { status: 200 });
}