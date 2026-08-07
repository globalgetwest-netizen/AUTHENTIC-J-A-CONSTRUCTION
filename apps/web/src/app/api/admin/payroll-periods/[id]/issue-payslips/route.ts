import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/payroll-periods/[id]/issue-payslips">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/payroll-periods/${id}/issue-payslips`, { method: "POST" });
  return toNext(res);
}