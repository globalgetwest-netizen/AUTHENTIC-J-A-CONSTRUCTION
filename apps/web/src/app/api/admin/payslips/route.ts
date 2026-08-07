import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = ["page", "pageSize", "sortBy", "sortOrder", "search", "status", "periodId", "employeeId"] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/payslips", FILTER_KEYS, req));
  return toNext(res);
}