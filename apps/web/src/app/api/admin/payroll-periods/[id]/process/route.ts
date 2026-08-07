import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/payroll-periods/[id]/process">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/payroll-periods/${id}/process`, { method: "POST" });
  return toNext(res);
}