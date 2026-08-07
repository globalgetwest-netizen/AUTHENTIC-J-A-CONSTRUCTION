import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/material-categories/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/material-categories/${id}`);
  return toNext(res);
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/material-categories/[id]">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/material-categories/${id}`, { method: "PATCH", body });
  return toNext(res);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/material-categories/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/material-categories/${id}`, { method: "DELETE" });
  return toNext(res);
}
