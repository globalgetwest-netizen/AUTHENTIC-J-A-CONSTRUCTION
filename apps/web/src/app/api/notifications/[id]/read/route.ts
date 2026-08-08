import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** POST /api/notifications/:id/read — mark one notification read. */
export async function POST(_req: Request, ctx: RouteContext<"/api/notifications/[id]/read">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/notifications/${id}/read`, { method: "POST" });
  return toNext(res);
}