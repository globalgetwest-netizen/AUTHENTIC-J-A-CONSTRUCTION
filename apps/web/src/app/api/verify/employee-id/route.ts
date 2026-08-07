import { toNext } from "@/lib/admin/resources";

export const runtime = "nodejs";

/** Public QR verification — no auth token; the API endpoint is @Public(). */
export async function POST(req: Request): Promise<Response> {
  const apiBase = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
  const body = await req.text();
  const res = await fetch(`${apiBase}/api/v1/employee-ids/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    cache: "no-store",
  });
  return toNext(res);
}