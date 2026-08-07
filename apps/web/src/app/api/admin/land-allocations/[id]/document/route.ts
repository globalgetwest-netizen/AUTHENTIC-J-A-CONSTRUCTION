import { apiFetch } from "@/lib/admin/auth";
import { renderLandAllocationPdf } from "@/lib/documents/pdf";
import type { LandAllocation } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/land-allocations/[id]/document">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/land-allocations/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const allocation = (await res.json()) as LandAllocation;

  const pdf = await renderLandAllocationPdf({
    allocation,
    project: allocation.landProject,
    plot: allocation.plot,
    client: allocation.client,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="allocation-of-land-${allocation.allocationCode}.pdf"`,
    },
  });
}
