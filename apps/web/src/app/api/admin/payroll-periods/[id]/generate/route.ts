import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/payroll-periods/[id]/generate">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/payroll-periods/${id}/generate`, { method: "POST" });
  return toNext(res);
}