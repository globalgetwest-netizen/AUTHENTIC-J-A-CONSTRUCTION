import { apiFetch } from "@/lib/admin/auth";
import { renderQuotationPdf } from "@/lib/documents/pdf";
import type { Quotation } from "@/lib/admin/types";

export const runtime = "nodejs";

/**
 * Client downloads their own quotation as a PDF. Ownership is enforced by the
 * API's self-scoped `GET /client/quotations/:id`, which returns 404 for any
 * quotation that does not belong to the caller's linked Client — so a signed-in
 * client can never fetch another client's (or the company's) document.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/client/quotation/[id]/pdf">) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/client/quotations/${id}`);
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