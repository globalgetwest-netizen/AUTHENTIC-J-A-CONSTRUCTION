/**
 * AUTHENTIC J.A. CONSTRUCTION LTD. — public company profile.
 *
 * Single source of truth for every editable piece of company data the public
 * website renders (contacts, registration, addresses, hours, social media).
 * Change values here once and every page reflects them. When the admin
 * Company-Settings module (DB-backed) lands, this file becomes the fallback
 * and the API record becomes the source of truth.
 *
 * Social entries: set `url` to `null` while an account is unconfigured — the
 * footer then renders the icon in a disabled state instead of linking nowhere.
 */

/**
 * Official company logo — approved branding asset.
 *
 * Uses the approved clean logo `/brand/aja-logo-clean.png` everywhere
 * on the public site (header, footer, CompanySignboard). The `Logo`
 * component and `CompanySignboard` both read this config, so changing
 * it here updates the whole site.
 *
 * NOTE: legacy filenames (`aja-logo.png`, `ajac-logo.jpg`) were retired
 * as part of the corporate-branding unification — do not reintroduce them.
 */
export const COMPANY_LOGO = {
  src: "/brand/aja-logo-clean.png",
  candidates: [] as readonly string[],
  alt: "AUTHENTIC J.A. CONSTRUCTION LTD. official logo",
} as const;

export const COMPANY = {
  name: "AUTHENTIC J.A. CONSTRUCTION LTD.",
  shortName: "AUTHENTIC J.A.",
  motto: "Quality Structures. Trusted Solutions.",
  country: "Ghana",
  registrationNo: "CS212101021",
  taxId: "C0061318752",
  headOffice: "Kumasi, Ghana",
  registeredAddress: "Accra, Ghana",
  email: "info@authenticjaconstruction.com",
  /** International display format. `telHref()` derives the dialable link. */
  phones: ["+233 245 295 866", "+233 545 008 282", "+233 553 864 636"] as const,
  /** Purpose label shown alongside each number (same order as `phones`). */
  phoneLabels: ["Sales", "Customer Service", "General Support"] as const,
  /** E.164 digits (no +) used for WhatsApp deep links. */
  whatsappNumber: "233245295866",
  officeHours: [
    { days: "Monday – Friday", hours: "8:00 – 17:00" },
    { days: "Saturday", hours: "9:00 – 14:00" },
    { days: "Sunday / Public holidays", hours: "Closed" },
  ],
} as const;

export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, "")}`;
}

/** WhatsApp deep link from an E.164 number (digits only, no +). */
export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "youtube"
  | "linkedin";

export interface SocialEntry {
  platform: SocialPlatform;
  label: string;
  url: string | null;
}

export const SOCIAL_MEDIA: SocialEntry[] = [
  { platform: "facebook", label: "Facebook", url: null },
  { platform: "instagram", label: "Instagram", url: null },
  { platform: "tiktok", label: "TikTok", url: null },
  { platform: "whatsapp", label: "WhatsApp", url: whatsappHref(COMPANY.whatsappNumber) },
  { platform: "youtube", label: "YouTube", url: null },
  { platform: "linkedin", label: "LinkedIn", url: null },
];

/**
 * Company leadership — displayed in the footer. `email` doubles as the
 * department email for that office (ceo@, daniel@, abdulrazak@).
 */
export const LEADERSHIP = [
  { name: "Joseph Acquah", title: "CEO & Founder", email: "ceo@authenticjaconstruction.com" },
  { name: "Rev. Daniel Acquah", title: "Director I", email: "daniel@authenticjaconstruction.com" },
  { name: "Abdulrazak Acquah", title: "Secretary I", email: "abdulrazak@authenticjaconstruction.com" },
] as const;

/** Department contact emails shown in the footer alongside leadership. */
export const DEPARTMENT_EMAILS = [
  { department: "Administration", email: "admin@authenticjaconstruction.com" },
  { department: "Human Resources", email: "hr@authenticjaconstruction.com" },
  { department: "Projects", email: "projects@authenticjaconstruction.com" },
  { department: "Support", email: "support@authenticjaconstruction.com" },
] as const;

export type RequestTypeKey =
  | "quote"
  | "project"
  | "site-inspection"
  | "property"
  | "land"
  | "sales"
  | "consultation";

export const REQUEST_TYPES: Record<RequestTypeKey, { label: string; short: string }> = {
  quote: { label: "Request a Quote", short: "Quote" },
  project: { label: "Start a Project", short: "Project" },
  "site-inspection": { label: "Book a Site Inspection", short: "Site Inspection" },
  property: { label: "Request Property Information", short: "Property" },
  land: { label: "Request Land Information", short: "Land" },
  sales: { label: "Contact Sales", short: "Sales" },
  consultation: { label: "Book an Appointment", short: "Consultation" },
};

/**
 * Image slots for the public site, pre-wired to fixed paths under `public/company/`.
 * Drop a photo at the documented filename (see `public/company/README.md`) and it
 * renders here — no code change needed. If the file isn't present yet, PhotoBlock
 * shows a clean branded panel instead of a broken image.
 */
export const COMPANY_IMAGES = {
  hero: { src: "/company/hero-site.jpg" as string | null, alt: "AUTHENTIC J.A. construction site in Ghana" },
  construction: { src: "/company/construction.jpg" as string | null, alt: "Building construction and reinforcement works" },
  materials: { src: "/company/materials.jpg" as string | null, alt: "Factory-made blocks, sand and quarry stones" },
  equipment: { src: "/company/equipment.jpg" as string | null, alt: "Excavators, wheel loaders and heavy equipment" },
  /** Fleet photos shown on the Equipment Gallery section (right column, stacked). */
  fleet: [
    { src: "/company/gallery/tipper-trucks.jpg" as string | null, alt: "AUTHENTIC J.A. tipper trucks loading at quarry" },
    { src: "/company/gallery/wheel-loader.jpg" as string | null, alt: "Wheel loader loading quarry stones into a tipper truck" },
  ],
  /** Ready-made Pillars section — process shot + product catalogs. */
  pillars: {
    construction: { src: "/company/gallery/pillars-construction.jpg" as string | null, alt: "Concrete pillar formwork being built on site by AUTHENTIC J.A. operatives" },
    catalog: { src: "/company/gallery/pillars-catalog.jpg" as string | null, alt: "AUTHENTIC J.A. ready-made concrete pillar designs (12 designs)" },
    premium: { src: "/company/gallery/pillars-premium.jpg" as string | null, alt: "AUTHENTIC J.A. premium ready-made pillar designs (24 options)" },
  },
  /** Materials product gallery (Materials section) — one photo per supplied product. */
  materialsGallery: [
    { src: "/company/gallery/quarry-stones.jpg" as string | null, alt: "Quarry stones and chips supplied by AUTHENTIC J.A." },
    { src: "/company/gallery/foundation-sand.jpg" as string | null, alt: "Foundation sand supplied by AUTHENTIC J.A." },
    { src: "/company/gallery/cement-binders.jpg" as string | null, alt: "Cement and binders supplied by AUTHENTIC J.A." },
    { src: "/company/gallery/gravel.jpg" as string | null, alt: "Gravel supplied by AUTHENTIC J.A." },
    { src: "/company/gallery/quarry-dust.jpg" as string | null, alt: "Quarry dust supplied by AUTHENTIC J.A." },
    { src: "/company/gallery/factory-blocks.jpg" as string | null, alt: "Factory-made blocks from the AUTHENTIC J.A. block factory" },
  ],
  /** Land plots slot (Real Estate / Land section). */
  land: { src: "/company/gallery/land-plot.jpg" as string | null, alt: "Plots of land available for allocation by AUTHENTIC J.A." },
  /** Architectural designs showcase (Services section). */
  architecturalDesigns: { src: "/company/gallery/architectural-design.jpg" as string | null, alt: "Architectural design drawings produced by AUTHENTIC J.A." },
} as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
] as const;