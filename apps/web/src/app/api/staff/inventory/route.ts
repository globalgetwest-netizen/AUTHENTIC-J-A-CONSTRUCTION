import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = ["page", "pageSize", "sortBy", "sortOrder", "search", "warehouseId", "materialId"] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/staff/inventory", FILTER_KEYS, req));
  return toNext(res);
}
