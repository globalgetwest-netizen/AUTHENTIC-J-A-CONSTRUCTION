import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/asset-assignments/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/asset-assignments/${id}`);
  return toNext(res);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/asset-assignments/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/asset-assignments/${id}`, { method: "DELETE" });
  return toNext(res);
}