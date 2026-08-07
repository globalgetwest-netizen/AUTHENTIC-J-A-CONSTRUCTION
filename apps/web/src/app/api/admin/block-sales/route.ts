import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = ["page", "pageSize", "sortBy", "sortOrder", "search", "productId", "clientId", "status"] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/block-sales", FILTER_KEYS, req));
  return toNext(res);
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await apiFetch("/block-sales", { method: "POST", body });
  return toNext(res);
}
