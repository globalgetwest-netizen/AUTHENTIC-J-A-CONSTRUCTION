import { apiFetch } from "@/lib/admin/auth";
import { renderEmployeeIdCardPdf } from "@/lib/documents/pdf";
import type { EmployeeIdCard } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/employee-ids/[id]/card">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/employee-ids/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const card = (await res.json()) as EmployeeIdCard;
  const pdf = await renderEmployeeIdCardPdf({ card });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="employee-id-${card.cardNumber}.pdf"`,
    },
  });
}