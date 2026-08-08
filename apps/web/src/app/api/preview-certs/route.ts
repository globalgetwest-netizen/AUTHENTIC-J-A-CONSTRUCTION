import { NextResponse } from "next/server";
import {
  renderAssetOwnershipCertificatePdf,
  renderCompanyProfilePdf,
  renderProjectCompletionCertificatePdf,
  renderWorkerCertificatePdf,
} from "@/lib/documents/pdf";

export const runtime = "nodejs";

/**
 * Unauthenticated preview — renders all 4 premium certificate types with
 * sample data.  Prefixed with _preview so it's excluded from production
 * builds.  Delete after QA.
 */

const employee = {
  id: "emp_1",
  firstName: "Kwame",
  lastName: "Mensah",
  otherNames: "A.",
  employeeCode: "AJ-0012",
  hireDate: "2021-03-15",
  status: "ACTIVE",
  employmentType: "FULL_TIME",
  gender: "MALE",
  nationalId: "GHA-000000000-1",
  position: { title: "Senior Site Engineer" },
  department: { name: "Construction" },
  branch: { name: "Kumasi" },
} as never;

const project = {
  code: "PRJ-2024-012",
  name: "Sesco Ref Residential Development",
  projectType: "RESIDENTIAL",
  status: "COMPLETED",
  client: { name: "Kofi Asante" },
  location: "Kenyase – Brofoyedru",
  address: "Plot 13, Block K",
  budgetAmount: 850000,
  startDate: "2024-01-10",
  endDate: "2024-11-20",
  description: "Four-bedroom detached family residence.",
} as never;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "all";

  try {
    const results: Record<string, { bytes: number; ok: boolean }> = {};

    if (type === "worker" || type === "all") {
      const pdf = await renderWorkerCertificatePdf({ employee, issuedOn: "2026-08-08" });
      if (type === "worker") return pdfResponse(pdf, "worker-certificate-preview.pdf");
      results.worker = { bytes: pdf.length, ok: pdf.subarray(0, 5).toString("latin1") === "%PDF-" };
    }
    if (type === "asset" || type === "all") {
      const pdf = await renderAssetOwnershipCertificatePdf({
        title: "CERTIFICATE OF OWNERSHIP",
        subtitle: "Equipment, Plant & Vehicle Fleet",
        serial: "AJAC/COW/2026/0042",
        owner: "AUTHENTIC J.A. CONSTRUCTION LTD.",
        kind: "office equipment asset",
        assetName: "Dell Precision Workstation — ESL1G42",
        assetSub: "Registered in the company asset register",
        rows: [
          { label: "Asset tag", value: "AST-2023-0042" },
          { label: "Category", value: "Office Equipment" },
          { label: "Acquired", value: "18 May 2023" },
          { label: "Condition", value: "In service" },
        ],
        issuedOn: "2026-08-08",
      });
      if (type === "asset") return pdfResponse(pdf, "asset-certificate-preview.pdf");
      results.asset = { bytes: pdf.length, ok: pdf.subarray(0, 5).toString("latin1") === "%PDF-" };
    }
    if (type === "completion" || type === "all") {
      const pdf = await renderProjectCompletionCertificatePdf({ project, clientName: "Kofi Asante", issuedOn: "2026-08-08" });
      if (type === "completion") return pdfResponse(pdf, "completion-certificate-preview.pdf");
      results.completion = { bytes: pdf.length, ok: pdf.subarray(0, 5).toString("latin1") === "%PDF-" };
    }
    if (type === "profile" || type === "all") {
      const pdf = await renderCompanyProfilePdf({
        projects: [
          { code: "PJ-2024-012", name: "Sesco Ref Residential Development", projectType: "RESIDENTIAL", status: "COMPLETED", client: { contactName: "Kofi Asante", id: "c1", clientCode: "CL-001", type: "INDIVIDUAL", status: "ACTIVE", createdAt: "2024-01-01" } },
        ],
        equipment: [{ assetCode: "EQ-001", name: "Cat 320 Excavator", category: "Heavy Machinery", status: "IN_SERVICE" }],
        issuedOn: "2026-08-08",
      });
      if (type === "profile") return pdfResponse(pdf, "company-profile-preview.pdf");
      results.profile = { bytes: pdf.length, ok: pdf.subarray(0, 5).toString("latin1") === "%PDF-" };
    }

    return NextResponse.json({
      ok: true,
      note: "Pass ?type=worker|asset|completion|profile to download a single PDF directly.",
      urls: {
        worker: "/api/preview-certs?type=worker",
        asset: "/api/preview-certs?type=asset",
        completion: "/api/preview-certs?type=completion",
        profile: "/api/preview-certs?type=profile",
      },
      results,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

function pdfResponse(buf: Uint8Array, filename: string) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${filename}"`,
    },
  });
}
