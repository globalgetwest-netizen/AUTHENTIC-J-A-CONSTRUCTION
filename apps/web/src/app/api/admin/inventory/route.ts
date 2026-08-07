import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = ["page", "pageSize", "sortBy", "sortOrder", "search", "warehouseId", "categoryId"] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/inventory", FILTER_KEYS, req));
  return toNext(res);
}

