import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/payslips/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/payslips/${id}`);
  return toNext(res);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/payslips/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/payslips/${id}`, { method: "DELETE" });
  return toNext(res);
}