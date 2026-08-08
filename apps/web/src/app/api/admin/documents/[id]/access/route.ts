import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** POST /api/admin/documents/:id/access — grant a principal VIEW/EDIT access. */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/admin/documents/[id]/access">,
): Promise<Response> {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/documents/${id}/access`, { method: "POST", body });
  return toNext(res);
}