import { apiFetch } from "@/lib/admin/auth";
import { renderQuotationPdf } from "@/lib/documents/pdf";
import type { Quotation } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/quotations/[id]/pdf">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/quotations/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const quotation = (await res.json()) as Quotation;
  const pdf = await renderQuotationPdf({
    quotation,
    client: quotation.client,
    project: quotation.project,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${quotation.quotationNo}.pdf"`,
    },
  });
}
