import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET(_req: Request, ctx: RouteContext<"/api/staff/payslips/[id]">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/staff/payslips/${id}`);
  return toNext(res);
}