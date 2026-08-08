import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** GET /api/admin/documents/:id — document detail incl. versions + access. */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/documents/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/documents/${id}`);
  return toNext(res);
}

/** DELETE /api/admin/documents/:id — soft-delete a document. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/documents/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/documents/${id}`, { method: "DELETE" });
  return toNext(res);
}