import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** POST /api/admin/documents/:id/status — change the document workflow status. */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/admin/documents/[id]/status">,
): Promise<Response> {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/documents/${id}/status`, { method: "POST", body });
  return toNext(res);
}