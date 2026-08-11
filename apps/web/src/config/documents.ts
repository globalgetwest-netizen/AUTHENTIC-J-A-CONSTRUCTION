/**
 * AUTHENTIC J.A. CONSTRUCTION LTD. — generated-document letterhead.
 *
 * Single source of truth for everything that appears on official PDFs
 * (quotations, and later invoices/contracts/letters). Swap these values once
 * and every generated document reflects them — this is the file that changes
 * when the real domain, professional email and final letterhead arrive.
 *
 * To adopt the new letterhead image: drop the file under `public/brand/`,
 * set `letterheadImage` to its path, and the PDF header switches from the
 * text band below to the supplied artwork.
 */

export interface BankAccount {
  name: string;
  accountName?: string;
  accountNumber?: string;
  branch?: string;
}

export const LETTERHEAD = {
  name: "AUTHENTIC J.A. CONSTRUCTION LTD.",
  shortName: "AUTHENTIC J.A.",
  tagline: "Quality Structures. Trusted Solutions.",
  registrationNo: "CS212101021",
  taxId: "C0061318752",
  headOffice: "Plot 13, Block K, Kenyase – Brofoyedru, Ghana",
  city: "Kumasi",
  region: "Ashanti",
  gps: "AD-326-1730",
  registeredAddress: "Accra, Ghana",
  phones: ["+233 245 295 866", "+233 553 864 636"] as const,
  phoneLabels: ["Tel", "Mob"] as const,
  email: "info@authenticjaconstruction.com",
  website: "www.authenticjaconstruction.com",
  /** Real company logo (photo of physical sign, background-removed) — used on documents. */
  logo: "/brand/aja-logo-clean.png",
  /** Real company logo — used in the company seal/stamp. */
  monogram: "/brand/aja-logo-clean.png",
  /** Chief Executive Officer — signs official documents. */
  ceo: {
    name: "JOSEPH ACQUAH",
    title: "Chief Executive Officer",
    signature: "/brand/ceo-signature.png",
    stamp: "/brand/ceo-stamp.png",
  },
  /** Real main company letterhead (full A4 page) — used on commercial documents
   *  (quotations, land allocations, company profile). Certificates use the text-band instead. */
  letterheadImage: "/brand/aja-main-company-letterhead.png" as string | null,
  /** Real CEO & Founder letterhead (full A4 page) — used on executive / CEO correspondence. */
  ceoLetterheadImage: "/brand/aja-ceo-founder-letterhead.png" as string | null,
  banks: [
    { name: "Universal Merchant Bank (UMB)", accountName: "", accountNumber: "", branch: "" },
    { name: "Fidelity Bank", accountName: "", accountNumber: "", branch: "" },
    { name: "Sekyedomase Rural Bank Ltd", accountName: "", accountNumber: "", branch: "" },
  ] as BankAccount[],
  /** Default VAT rate (%) applied to quotations unless overridden per document. */
  vatRate: 15,
  currency: "GHS",
  quoteValidDays: 30,
  defaultTerms:
    "This quotation is valid for 30 days from the date of issue. All prices are in Ghana Cedis (GHS). A binding contract is formed only upon written acceptance followed by a signed agreement.",
} as const;
