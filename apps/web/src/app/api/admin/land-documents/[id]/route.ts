import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/land-documents/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/land-documents/${id}`);
  return toNext(res);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/land-documents/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/land-documents/${id}`, { method: "DELETE" });
  return toNext(res);
}
