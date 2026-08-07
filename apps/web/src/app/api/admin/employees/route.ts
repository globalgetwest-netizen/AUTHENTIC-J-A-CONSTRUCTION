import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = [
  "page",
  "pageSize",
  "sortBy",
  "sortOrder",
  "status",
  "employmentType",
  "departmentId",
  "positionId",
  "branchId",
  "search",
] as const;

export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/employees", FILTER_KEYS, req));
  return toNext(res);
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await apiFetch("/employees", { method: "POST", body });
  return toNext(res);
}
