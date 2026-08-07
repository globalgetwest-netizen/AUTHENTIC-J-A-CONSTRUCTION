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
  registeredAddress: "Accra, Ghana",
  phones: ["+233 245 295 866", "+233 553 864 636"] as const,
  phoneLabels: ["Tel", "Mob"] as const,
  /** Replace with the real domain email once registered (next week). */
  email: "authenticjaconstruction.gh@gmail.com",
  website: "",
  logo: "/brand/aja-logo.png",
  /** Set to a public/ path to render the full letterhead image in the PDF header. */
  letterheadImage: null as string | null,
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
