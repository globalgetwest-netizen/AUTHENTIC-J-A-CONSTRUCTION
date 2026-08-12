import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/employee-ids/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/employee-ids/${id}`);
  return toNext(res);
}

/** PATCH-style update of an existing card (type, holder details, expiry). */
export async function PUT(req: Request, ctx: RouteContext<"/api/admin/employee-ids/[id]">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/employee-ids/${id}`, { method: "PUT", body });
  return toNext(res);
}