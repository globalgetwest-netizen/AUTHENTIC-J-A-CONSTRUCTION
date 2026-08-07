import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/projects/[id]/members">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/projects/${id}/members`);
  return toNext(res);
}

export async function POST(req: Request, ctx: RouteContext<"/api/admin/projects/[id]/members">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/projects/${id}/members`, { method: "POST", body });
  return toNext(res);
}
