import { apiFetch } from "@/lib/admin/auth";
import { renderAssetOwnershipCertificatePdf } from "@/lib/documents/pdf";
import { quantity } from "@/lib/documents/format";
import type { Property } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/admin/properties/[id]/certificate">,
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const includeStamp = url.searchParams.get("stamp") !== "false";
  const includeSignature = url.searchParams.get("signature") !== "false";
  const res = await apiFetch(`/properties/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const property = (await res.json()) as Property;
  const issuedOn = new Date().toISOString();
  const serial = `AJAC/CTO/${issuedOn.slice(0, 4)}/${property.code}`;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Property code", value: property.code },
    { label: "Type", value: property.propertyType?.name ?? "—" },
    { label: "Status", value: property.status },
  ];
  if (property.address) rows.push({ label: "Address", value: property.address });
  if (property.location) rows.push({ label: "Location", value: property.location });
  if (property.areaSqm != null)
    rows.push({ label: "Land area", value: `${quantity(property.areaSqm)} m²` });
  if (property.bedrooms != null)
    rows.push({ label: "Bedrooms", value: String(property.bedrooms) });
  if (property.bathrooms != null)
    rows.push({ label: "Bathrooms", value: String(property.bathrooms) });
  if (property.price != null)
    rows.push({
      label: "Valuation",
      value: new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(Number(property.price)),
    });

  const pdf = await renderAssetOwnershipCertificatePdf({
    title: "CERTIFICATE OF PROPERTY OWNERSHIP",
    subtitle: "Company Property Portfolio",
    serial,
    owner: "AUTHENTIC J.A. CONSTRUCTION LTD.",
    kind: "property",
    assetName: property.name,
    assetSub: property.address ?? null,
    rows,
    note: "This certificate confirms the company's legal and equitable ownership of the property described above. The property is a corporate asset and any disposal is subject to board approval.",
    issuedOn,
    includeStamp,
    includeSignature,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="property-ownership-${property.code}.pdf"`,
    },
  });
}
