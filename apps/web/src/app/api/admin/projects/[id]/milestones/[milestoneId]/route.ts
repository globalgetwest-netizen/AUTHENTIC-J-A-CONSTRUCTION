import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/admin/projects/[id]/milestones/[milestoneId]">,
) {
  const { id, milestoneId } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/projects/${id}/milestones/${milestoneId}`, { method: "PATCH", body });
  return toNext(res);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/admin/projects/[id]/milestones/[milestoneId]">,
) {
  const { id, milestoneId } = await ctx.params;
  const res = await apiFetch(`/projects/${id}/milestones/${milestoneId}`, { method: "DELETE" });
  return toNext(res);
}
