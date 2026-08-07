import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/invoices/[id]/items">) {
  const { id } = await ctx.params;
  const body = await req.text();
  const res = await apiFetch(`/invoices/${id}/items`, { method: "POST", body });
  return toNext(res);
}