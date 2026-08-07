import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = [
  "page",
  "pageSize",
  "sortBy",
  "sortOrder",
  "source",
  "status",
  "assignedToId",
  "search",
] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/leads", FILTER_KEYS, req));
  return toNext(res);
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await apiFetch("/leads", { method: "POST", body });
  return toNext(res);
}