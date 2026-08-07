import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/asset-assignments/[id]/return">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/asset-assignments/${id}/return`, { method: "POST" });
  return toNext(res);
}