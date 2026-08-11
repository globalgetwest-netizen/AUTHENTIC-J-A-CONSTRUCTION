/**
 * One-off render: produce sample PDFs proving the real company letterhead appears
 * on official documents (quotation, company profile) and text-band on certificates.
 *
 * Run: NODE_ENV=development npx tsx scripts/render-preview.ts
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Mock fixtures are cast to template props on purpose. */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { LETTERHEAD } from "../src/config/documents";
import { qrDataUri } from "../src/lib/documents/pdf";
import { certificateVerifyUrl } from "../src/lib/documents/verify";

const OUT = ".pdfcheck/preview";
const MIME: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
};

async function asset(p: string): Promise<string | null> {
  const fp = path.join(process.cwd(), "public", p.replace(/^\/+/, ""));
  try {
    const b = await fs.readFile(fp);
    return `data:${MIME[path.extname(fp).toLowerCase()] ?? "image/png"};base64,${b.toString("base64")}`;
  } catch {
    return null;
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const logoSrc = await asset(LETTERHEAD.logo);
  const letterheadSrc = await asset(LETTERHEAD.letterheadImage ?? "");
  const ceoLetterheadSrc = await asset(LETTERHEAD.ceoLetterheadImage ?? "");
  const signatureSrc = await asset(LETTERHEAD.ceo.signature);
  const stampSrc = await asset(LETTERHEAD.ceo.stamp);
  console.table({
    logo: !!logoSrc,
    letterhead: !!letterheadSrc,
    ceoLetterhead: !!ceoLetterheadSrc,
    signature: !!signatureSrc,
    stamp: !!stampSrc,
  });

  const { QuotationTemplate } = await import("../src/components/documents/QuotationTemplate");
  const { WorkerCertificateTemplate } = await import("../src/components/documents/WorkerCertificateTemplate");
  const { AssetOwnershipCertificateTemplate } = await import("../src/components/documents/AssetOwnershipCertificateTemplate");
  const { ProjectCompletionCertificateTemplate } = await import("../src/components/documents/ProjectCompletionCertificateTemplate");
  const { CeoLetterTemplate } = await import("../src/components/documents/CeoLetterTemplate");

  // Verification QRs (same code path as the real renderers in pdf.ts).
  const workerSerial = "AJAC/COE/2026/AJA-W-0142";
  const assetSerial = "AJAC/AOC/2026/CAT-001";
  const pccSerial = "AJAC/PCC/2026/AJA-PRJ-0031";
  const issuedOn = "2026-08-10T00:00:00.000Z";
  const workerQr = await qrDataUri(certificateVerifyUrl(workerSerial, issuedOn, "COE"));
  const assetQr = await qrDataUri(certificateVerifyUrl(assetSerial, issuedOn, "AOC"));
  const pccQr = await qrDataUri(certificateVerifyUrl(pccSerial, issuedOn, "PCC"));
  console.log("verify worker :", certificateVerifyUrl(workerSerial, issuedOn, "COE"));
  console.log("verify asset  :", certificateVerifyUrl(assetSerial, issuedOn, "AOC"));
  console.log("verify pcc    :", certificateVerifyUrl(pccSerial, issuedOn, "PCC"));

  const client = {
    id: "c1", name: "ACORN NURSERY & BUILDING LTD.", contactName: "Mr. Samuel Owusu",
    email: "sam@acorn.com.gh", phone: "+233 24 123 4567",
    address: "No. 4, Spintex Road, Accra", type: "COMPANY", createdAt: "", updatedAt: "",
  };
  const emp = {
    id: "e1", employeeId: "AJA-W-0142", firstName: "Kwame", lastName: "Mensah",
    position: "Senior Quantity Surveyor", department: "Commercial",
    dateOfBirth: "1988-06-12", dateJoined: "2021-01-04",
    phone: "+233 50 222 3344", email: "kwame.mensah@authenticjaconstruction.com",
    status: "ACTIVE", idType: "GHANA_CARD", idNumber: "GHA-882344567-9", createdAt: "", updatedAt: "",
  };
  const quotation = {
    id: "q1", refNo: "AJA/QTN/2026/048", date: "2026-08-10", validUntil: "2026-09-09",
    status: "ISSUED", clientId: "c1", projectId: null,
    items: [
      { id: "i1", description: "Construction of 2-storey 6-bedroom residential villa (turnkey)", quantity: 1, unit: "Lot", unitPrice: 985000, amount: 985000, category: "Buildings" },
      { id: "i2", description: "Foundations, columns and structural RC frame", quantity: 1, unit: "Lot", unitPrice: 212000, amount: 212000, category: "Structural" },
      { id: "i3", description: "Mechanical, electrical and plumbing (MEP) installations", quantity: 1, unit: "Lot", unitPrice: 164000, amount: 164000, category: "MEP" },
    ],
    subtotal: 1361000, tax: 204150, discount: 0, total: 1565150,
    notes: "Firm quotation for the above scope as per the approved architectural drawings and BOQ.",
    terms: LETTERHEAD.defaultTerms, createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
  };
  const asClient = { id: "ch1", name: "ASABEEK LTD.", contactName: "Abdul Karim", email: "abdul@asabeek.com", phone: "+233 20 111 2222", address: "Tamale", type: "COMPANY", createdAt: "", updatedAt: "" };

  async function write(name: string, el: ReactElement<DocumentProps>) {
    const buf = await renderToBuffer(el);
    await fs.writeFile(path.join(OUT, name), buf);
    console.log("wrote", name, `(${buf.length} bytes)`);
  }

  // 1) Quotation — REAL letterhead image
  await write("01-quotation-letterhead.pdf", createElement(QuotationTemplate, {
    quotation: quotation as any, client: client as any, project: null, logoSrc, letterheadSrc,
  }) as any);

  // 2) Worker certificate — text-band (QR verify)
  await write("02-worker-certificate-textband.pdf", createElement(WorkerCertificateTemplate, {
    employee: emp as any, serial: workerSerial, logoSrc, signatureSrc, stampSrc, qrSrc: workerQr, issuedOn,
  }) as any);

  // 3) Asset ownership certificate — text-band (QR verify)
  await write("03-asset-certificate-textband.pdf", createElement(AssetOwnershipCertificateTemplate, {
    title: "CERTIFICATE OF OWNERSHIP", subtitle: "Heavy Equipment",
    serial: assetSerial, owner: asClient.name, kind: "Wheel Loader",
    assetName: "CAT 962K Wheel Loader", assetSub: "Yellow, 2018",
    rows: [
      { label: "Owner", value: asClient.name },
      { label: "Make / Model", value: "CAT 962K" },
      { label: "Serial No.", value: "CAT0962KPTW005112" },
      { label: "Date of Transfer", value: "05 August 2026" },
    ],
    note: "This certifies the lawful ownership of the above equipment under Ghana law.",
    issuedOn, logoSrc, signatureSrc, stampSrc, qrSrc: assetQr,
  }) as any);

  // 3b) Project practical-completion certificate — text-band (QR verify)
  await write("03b-completion-certificate-textband.pdf", createElement(ProjectCompletionCertificateTemplate, {
    project: {
      id: "p1", code: "AJA-PRJ-0031",
      name: "Construction of 2-Storey Residential Villa — Kenyase",
      projectType: "RESIDENTIAL", status: "COMPLETED",
      location: "Kenyase - Brofoyedru, Kumasi",
      startDate: "2025-02-10", endDate: "2026-07-28",
      budgetAmount: 1565150,
    } as any,
    clientName: "ACORN NURSERY & BUILDING LTD.",
    managerName: "Kwame Mensah",
    serial: pccSerial, logoSrc, signatureSrc, stampSrc, qrSrc: pccQr, issuedOn,
  }) as any);

  // 4) CEO & Founder letter — full CEO letterhead
  await write("04-ceo-letter-head.pdf", createElement(CeoLetterTemplate, {
    letter: {
      refNo: "AJA/CEO/2026/012",
      date: "2026-08-10T00:00:00.000Z",
      recipient: "The Board of Directors",
      recipientAddress: "AUTHENTIC J.A. CONSTRUCTION LTD., Office of the CEO, Plot 13, Block K, Kenyase - Brofoyedru",
      salutation: "Dear Sirs,",
      subject: "RE: CORPORATE STRATEGIC DIRECTION FOR FINANCIAL YEAR 2026 / 2027",
      paragraphs: [
        "I write to formally set out the strategic direction of AUTHENTIC J.A. CONSTRUCTION LTD. for the next financial year, in line with our commitment to deliver quality structures and trusted solutions across construction, engineering, real estate and land allocation.",
        "Having reviewed our project pipeline, site operations and the performance of our equipment fleet and block factory, we will continue to consolidate our position in residential and commercial construction while expanding our land development pipeline and material supply channels.",
        "I invite the board and all departmental heads to align the resources and timelines under their charge with this direction, and to table any observations for consideration at the next management meeting.",
      ],
    } as any,
    logoSrc, signatureSrc, letterheadSrc: ceoLetterheadSrc,
  }) as any);
}

main().catch((e) => { console.error(e); process.exit(1); });