import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/admin/employee-ids/[id]/revoke">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/employee-ids/${id}/revoke`, { method: "POST" });
  return toNext(res);
}