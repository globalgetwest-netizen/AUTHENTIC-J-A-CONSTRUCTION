import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/branches/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/company-branches/${id}`);
  return toNext(res);
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/branches/[id]">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/company-branches/${id}`, { method: "PATCH", body });
  return toNext(res);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/branches/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/company-branches/${id}`, { method: "DELETE" });
  return toNext(res);
}
