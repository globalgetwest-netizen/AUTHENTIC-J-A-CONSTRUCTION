import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/invoices/[id]/items/[itemId]">) {
  const { id, itemId } = await ctx.params;
  const res = await apiFetch(`/invoices/${id}/items/${itemId}`, { method: "DELETE" });
  return toNext(res);
}