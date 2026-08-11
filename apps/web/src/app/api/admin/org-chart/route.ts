import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** GET /api/admin/org-chart — the command hierarchy (org.read). */
export async function GET() {
  const res = await apiFetch("/org/chart");
  return toNext(res);
}
