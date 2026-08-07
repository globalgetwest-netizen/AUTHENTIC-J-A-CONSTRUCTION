import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/admin/projects/[id]/members/[memberId]">,
) {
  const { id, memberId } = await ctx.params;
  const res = await apiFetch(`/projects/${id}/members/${memberId}`, { method: "DELETE" });
  return toNext(res);
}
