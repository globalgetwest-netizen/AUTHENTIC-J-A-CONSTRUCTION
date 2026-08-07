import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/admin/projects/[id]/milestones/[milestoneId]/complete">,
) {
  const { id, milestoneId } = await ctx.params;
  const res = await apiFetch(`/projects/${id}/milestones/${milestoneId}/complete`, {
    method: "POST",
  });
  return toNext(res);
}
