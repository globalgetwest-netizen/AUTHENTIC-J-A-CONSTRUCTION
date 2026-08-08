import { apiFetch } from "@/lib/admin/auth";
import { renderProjectCompletionCertificatePdf } from "@/lib/documents/pdf";
import type { Project } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/admin/projects/[id]/completion-certificate">,
) {
  const { id } = await ctx.params;
  const res = await apiFetch(`/projects/${id}`);
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const project = (await res.json()) as Project;
  if (project.status !== "COMPLETED") {
    return new Response(
      JSON.stringify({
        statusCode: 409,
        error: "Conflict",
        message: "A completion certificate can only be issued for completed projects.",
      }),
      {
        status: 409,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const clientName =
    project.client?.companyName || project.client?.contactName || null;
  const managerName = project.manager
    ? [project.manager.firstName, project.manager.lastName].filter(Boolean).join(" ")
    : null;

  const pdf = await renderProjectCompletionCertificatePdf({
    project,
    clientName,
    managerName,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="completion-certificate-${project.code}.pdf"`,
    },
  });
}
