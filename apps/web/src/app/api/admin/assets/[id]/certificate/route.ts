import { apiFetch } from "@/lib/admin/auth";
import { renderAssetOwnershipCertificatePdf } from "@/lib/documents/pdf";
import type { Asset } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/admin/assets/[id]/certificate">,
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const includeStamp = url.searchParams.get("stamp") !== "false";
  const includeSignature = url.searchParams.get("signature") !== "false";
  const res = await apiFetch(`/assets/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const asset = (await res.json()) as Asset;
  const issuedOn = new Date().toISOString();
  const serial = `AJAC/AOC/${issuedOn.slice(0, 4)}/${asset.assetCode}`;

  const pdf = await renderAssetOwnershipCertificatePdf({
    title: "CERTIFICATE OF ASSET OWNERSHIP",
    subtitle: "Company Asset Register",
    serial,
    owner: "AUTHENTIC J.A. CONSTRUCTION LTD.",
    kind: "asset",
    assetName: asset.name,
    assetSub: asset.category ? `Category — ${asset.category}` : null,
    rows: [
      { label: "Asset code", value: asset.assetCode },
      { label: "Category", value: asset.category || "—" },
      { label: "Status", value: asset.status },
      { label: "Location", value: asset.location || "—" },
      { label: "Date acquired", value: asset.purchaseDate || "—" },
      {
        label: "Cost / value",
        value:
          asset.purchasePrice != null
            ? new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(Number(asset.purchasePrice))
            : "—",
      },
    ],
    note: "This certificate confirms company ownership of the above asset as recorded in the asset register of AUTHENTIC J.A. CONSTRUCTION LTD. The asset is company property and may not be sold, transferred or encumbered without board approval.",
    issuedOn,
    includeStamp,
    includeSignature,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="asset-ownership-${asset.assetCode}.pdf"`,
    },
  });
}
