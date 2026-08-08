import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** POST /api/admin/documents/:id/versions — add a version (new file or URL). */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/admin/documents/[id]/versions">,
): Promise<Response> {
  const { id } = await ctx.params;
  const body = await req.formData();
  const res = await apiFetch(`/documents/${id}/versions`, { method: "POST", body });
  return toNext(res);
}