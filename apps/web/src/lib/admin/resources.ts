import { NextResponse } from "next/server";

export const PAGINATION_KEYS = ["page", "pageSize", "sortBy", "sortOrder"] as const;

/**
 * Rebuilds the list URL passing through only known filter keys, so arbitrary
 * query params never reach the API.
 */
export function buildListUrl(path: string, filterKeys: readonly string[], req: Request): string {
  const incoming = new URL(req.url).searchParams;
  const out = new URLSearchParams();
  for (const key of filterKeys) {
    const value = incoming.get(key);
    if (value) out.set(key, value);
  }
  const qs = out.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Passes a proxied API response through to the browser, preserving status + JSON body. */
export async function toNext(res: Response): Promise<NextResponse> {
  const text = await res.text();
  if (!text) return new NextResponse(null, { status: res.status });
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return NextResponse.json(body, { status: res.status });
}
