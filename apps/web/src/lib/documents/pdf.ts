import { promises as fs } from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type {
  Client,
  Employee,
  EmployeeIdCard,
  LandAllocation,
  LandPlot,
  LandProject,
  Property,
  Project,
  PropertySale,
  Quotation,
} from "@/lib/admin/types";
import { label } from "@/lib/admin/types";
import { LETTERHEAD } from "@/config/documents";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/** Reads a file under `public/` and returns it as a data URI, or null if missing. */
export async function readAssetAsDataUri(publicPath: string): Promise<string | null> {
  const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
  try {
    const data = await fs.readFile(filePath);
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "image/png";
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export interface QuotationPdfInput {
  quotation: Quotation;
  client?: Client | null;
  project?: Project | null;
}

/**
 * Renders a quotation record as an A4 PDF. The letterhead is read from the
 * swappable config at render time, so updating `src/config/documents.ts` (or
 * dropping in the real letterhead image) changes every generated document.
 */
export async function renderQuotationPdf(input: QuotationPdfInput): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { QuotationTemplate } = await import("@/components/documents/QuotationTemplate");
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(QuotationTemplate, {
    ...input,
    logoSrc,
    letterheadSrc,
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface PropertyCertificateInput {
  sale: PropertySale;
  property?: Property | null;
  client?: Client | null;
}

/** Renders a completed property sale as an A4 ownership certificate. */
export async function renderPropertyCertificatePdf(
  input: PropertyCertificateInput,
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { PropertyCertificateTemplate } = await import(
    "@/components/documents/PropertyCertificateTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(PropertyCertificateTemplate, {
    ...input,
    logoSrc,
    letterheadSrc,
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface LandAllocationDocumentInput {
  allocation: LandAllocation;
  project?: LandProject | null;
  plot?: LandPlot | null;
  client?: Client | null;
}

/** Renders a land allocation as an A4 allocation-of-land document. */
export async function renderLandAllocationPdf(input: LandAllocationDocumentInput): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { LandAllocationTemplate } = await import(
    "@/components/documents/LandAllocationTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(LandAllocationTemplate, {
    ...input,
    logoSrc,
    letterheadSrc,
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Absolute URL a scanned employee-ID QR points at (the public verify page). */
export function employeeIdVerifyUrl(cardNumber: string, token?: string | null): string {
  const url = `${APP_BASE_URL}/verify/employee-id?card=${encodeURIComponent(cardNumber)}`;
  return token ? `${url}&t=${encodeURIComponent(token)}` : url;
}

/** Renders a QR code for `text` as a pixel-perfect PNG data URI (pure-local). */
export async function qrDataUri(text: string): Promise<string | null> {
  const { toDataURL } = await import("qrcode");
  try {
    return await toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export interface EmployeeIdCardInput {
  card: EmployeeIdCard;
}

/** Renders a staff ID card as a printable, credit-card-sized PDF. */
export async function renderEmployeeIdCardPdf(input: EmployeeIdCardInput): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { EmployeeIdCardTemplate } = await import(
    "@/components/documents/EmployeeIdCardTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const qrSrc = await qrDataUri(employeeIdVerifyUrl(input.card.cardNumber, input.card.qrToken));
  const card = input.card;
  const template = createElement(EmployeeIdCardTemplate, {
    logoSrc,
    employee: card.employee ?? null,
    cardNumber: card.cardNumber,
    qrSrc,
    issuedAt: card.issuedAt,
    expiresAt: card.expiresAt,
    status: label(card.status),
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface WorkerCertificateInput {
  employee: Employee;
  issuedOn?: string;
}

/** Renders an employee's formal Certificate of Employment (Worker Certificate). */
export async function renderWorkerCertificatePdf(
  input: WorkerCertificateInput,
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { WorkerCertificateTemplate } = await import(
    "@/components/documents/WorkerCertificateTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(WorkerCertificateTemplate, {
    employee: input.employee,
    logoSrc,
    letterheadSrc,
    issuedOn: input.issuedOn ?? new Date().toISOString(),
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface AssetOwnershipCertificateInput {
  title: string;
  subtitle: string;
  serial: string;
  owner: string;
  kind: string;
  assetName: string;
  assetSub?: string | null;
  rows: Array<{ label: string; value: string }>;
  note?: string | null;
  issuedOn?: string;
}

/** Renders a Certificate of Ownership for an asset, equipment, vehicle or property. */
export async function renderAssetOwnershipCertificatePdf(
  input: AssetOwnershipCertificateInput,
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { AssetOwnershipCertificateTemplate } = await import(
    "@/components/documents/AssetOwnershipCertificateTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(AssetOwnershipCertificateTemplate, {
    ...input,
    logoSrc,
    letterheadSrc,
    issuedOn: input.issuedOn ?? new Date().toISOString(),
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface ProjectCompletionCertificateInput {
  project: Project;
  clientName?: string | null;
  managerName?: string | null;
  issuedOn?: string;
}

/** Renders a completed project's Certificate of Practical Completion. */
export async function renderProjectCompletionCertificatePdf(
  input: ProjectCompletionCertificateInput,
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { ProjectCompletionCertificateTemplate } = await import(
    "@/components/documents/ProjectCompletionCertificateTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(ProjectCompletionCertificateTemplate, {
    project: input.project,
    clientName: input.clientName ?? null,
    managerName: input.managerName ?? null,
    logoSrc,
    letterheadSrc,
    issuedOn: input.issuedOn ?? new Date().toISOString(),
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}

export interface CompanyProfileInput {
  projects?: Array<
    Pick<Project, "code" | "name" | "projectType" | "status" | "client">
  >;
  equipment?: Array<{ assetCode: string; name: string; category: string; status: string }>;
  issuedOn?: string;
}

/** Renders the corporate capability statement / company profile brochure. */
export async function renderCompanyProfilePdf(input: CompanyProfileInput): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { CompanyProfileTemplate } = await import(
    "@/components/documents/CompanyProfileTemplate"
  );
  const logoSrc = await readAssetAsDataUri(LETTERHEAD.logo);
  const letterheadSrc = LETTERHEAD.letterheadImage
    ? await readAssetAsDataUri(LETTERHEAD.letterheadImage)
    : null;
  const template = createElement(CompanyProfileTemplate, {
    logoSrc,
    letterheadSrc,
    issuedOn: input.issuedOn ?? new Date().toISOString(),
    projects: input.projects ?? [],
    equipment: input.equipment ?? [],
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(template);
}
