import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/maintenance/[id]/complete">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/maintenance/${id}/complete`, { method: "POST" });
  return toNext(res);
}