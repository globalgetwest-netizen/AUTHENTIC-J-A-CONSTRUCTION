import { apiFetch } from "@/lib/admin/auth";
import { renderPropertyCertificatePdf } from "@/lib/documents/pdf";
import type { PropertySale } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/property-sales/[id]/certificate">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/property-sales/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const sale = (await res.json()) as PropertySale;

  // The sale includes property + client; re-fetch the property so the
  // certificate can show its type name.
  let property = sale.property;
  if (sale.propertyId) {
    const propRes = await apiFetch(`/properties/${sale.propertyId}`);
    if (propRes.ok) property = await propRes.json();
  }

  const pdf = await renderPropertyCertificatePdf({
    sale,
    property,
    client: sale.client,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="ownership-certificate-${sale.saleCode}.pdf"`,
    },
  });
}
