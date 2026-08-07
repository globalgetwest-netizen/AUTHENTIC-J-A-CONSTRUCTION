import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(req: Request, ctx: RouteContext<"/api/staff/projects/[id]/updates">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/staff/projects/${id}/updates`, { method: "POST", body });
  return toNext(res);
}
