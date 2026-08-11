import { apiFetch } from "@/lib/admin/auth";
import { renderCompanyProfilePdf } from "@/lib/documents/pdf";
import type { Project } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeStamp = url.searchParams.get("stamp") !== "false";
  const includeSignature = url.searchParams.get("signature") !== "false";
  const [projectsRes, equipmentRes] = await Promise.all([
    apiFetch("/projects?pageSize=100"),
    apiFetch("/equipment?pageSize=100"),
  ]);

  if (!projectsRes.ok || !equipmentRes.ok) {
    const failing = projectsRes.ok ? equipmentRes : projectsRes;
    const text = await failing.text();
    return new Response(text, {
      status: failing.status,
      headers: { "content-type": "application/json" },
    });
  }

  const projects = (await projectsRes.json()) as { data: Project[] };
  const equipment = (await equipmentRes.json()) as {
    data: Array<{ assetCode: string; name: string; category: string; status: string }>;
  };

  const pdf = await renderCompanyProfilePdf({
    projects: projects.data ?? [],
    equipment: equipment.data ?? [],
    includeStamp,
    includeSignature,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "attachment; filename=company-profile.pdf",
    },
  });
}
