import { apiFetch } from "@/lib/admin/auth";
import { renderWorkerCertificatePdf } from "@/lib/documents/pdf";
import type { Employee } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/employees/[id]/certificate">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/employees/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const employee = (await res.json()) as Employee;
  const pdf = await renderWorkerCertificatePdf({ employee });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="worker-certificate-${employee.employeeCode}.pdf"`,
    },
  });
}
