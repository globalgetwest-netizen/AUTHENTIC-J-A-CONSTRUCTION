import { apiFetch } from "@/lib/admin/auth";
import { renderAssetOwnershipCertificatePdf } from "@/lib/documents/pdf";
import type { Equipment } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/equipment/[id]/certificate">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/equipment/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const equipment = (await res.json()) as Equipment;
  const issuedOn = new Date().toISOString();
  const isVehicle = Boolean(equipment.vehicle);
  const serial = `AJAC/AOC/${issuedOn.slice(0, 4)}/${equipment.assetCode}`;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Asset code", value: equipment.assetCode },
    { label: "Category", value: equipment.category || "—" },
    { label: "Status", value: equipment.status },
    { label: "Location", value: equipment.location || "—" },
  ];
  if (equipment.model) rows.push({ label: "Model", value: equipment.model });
  if (equipment.serialNo) rows.push({ label: "Chassis / serial no.", value: equipment.serialNo });
  if (equipment.vehicle) {
    rows.push({ label: "Registration no.", value: equipment.vehicle.registrationNo });
    if (equipment.vehicle.licensePlate)
      rows.push({ label: "License plate", value: equipment.vehicle.licensePlate });
  }
  if (equipment.purchaseDate)
    rows.push({ label: "Date acquired", value: equipment.purchaseDate });
  if (equipment.purchasePrice != null)
    rows.push({
      label: "Cost",
      value: new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(Number(equipment.purchasePrice)),
    });

  const pdf = await renderAssetOwnershipCertificatePdf({
    title: "CERTIFICATE OF OWNERSHIP",
    subtitle: isVehicle ? "Company Vehicle Register" : "Company Equipment & Plant Register",
    serial,
    owner: "AUTHENTIC J.A. CONSTRUCTION LTD.",
    kind: isVehicle ? "vehicle" : "equipment",
    assetName: equipment.name,
    assetSub: isVehicle
      ? `Registered — ${equipment.vehicle?.registrationNo}`
      : equipment.category
        ? `Category — ${equipment.category}`
        : null,
    rows,
    note: "This certificate confirms company ownership of the above equipment / vehicle as recorded in the fixed-asset register of AUTHENTIC J.A. CONSTRUCTION LTD.",
    issuedOn,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="ownership-${equipment.assetCode}.pdf"`,
    },
  });
}
