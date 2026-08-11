import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = ["page", "pageSize", "sortBy", "sortOrder", "search", "productId"] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/staff/block-productions", FILTER_KEYS, req));
  return toNext(res);
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await apiFetch("/staff/block-productions", { method: "POST", body });
  return toNext(res);
}
