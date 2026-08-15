// Centralized company data for the Company Profile document.
// This file contains the dynamic data that appears in the company profile,
// such as the description, services, and other textual information.
// For document branding (logo, letterhead, etc.), see {@link LETTERHEAD} in {@link @/config/documents}.

import { LETTERHEAD } from "@/config/documents";

/**
 * Core company information used across the site and documents.
 * This mirrors the relevant parts of LETTERHEAD and COMPANY for the profile.
 */
export const companyInfo = {
  name: LETTERHEAD.name,
  shortName: LETTERHEAD.shortName,
  motto: "Quality Structures. Trusted Solutions.", // from COMPANY.motto
  country: "Ghana",
  registrationNo: LETTERHEAD.registrationNo,
  taxId: LETTERHEAD.taxId,
  headOffice: LETTERHEAD.headOffice,
  city: LETTERHEAD.city,
  region: LETTERHEAD.region,
  gps: LETTERHEAD.gps,
  registeredAddress: LETTERHEAD.registeredAddress,
  email: LETTERHEAD.email,
  phones: LETTERHEAD.phones,
  phoneLabels: LETTERHEAD.phoneLabels,
  website: LETTERHEAD.website,
};

/**
 * Data for the Company Profile document.
 * Use this in {@link CompanyProfileTemplate} to avoid hardcoding.
 */
export const companyProfileData = {
  info: companyInfo,
  description: `A fully registered Ghanaian construction, engineering and real estate group (Reg No. ${companyInfo.registrationNo}, TIN ${companyInfo.taxId}), delivering quality structures and trusted solutions across construction, engineering, real estate, property development, land allocation, building materials and block manufacturing — every project executed under experienced management with full documentation.`,
  services: [
    { name: "Construction", desc: "Residential and commercial construction, delivered to specification on time." },
    { name: "Engineering", desc: "Civil and structural engineering, site works and infrastructure." },
    { name: "Real Estate", desc: "Property development, sales and rentals of houses and units." },
    { name: "Land Allocation", desc: "Land acquisition, plot allocation and documentation." },
    { name: "Building Materials", desc: "Supply of quarry stones, sand, gravel, cement and aggregates." },
    { name: "Block Factory", desc: "High-strength factory-made blocks of consistent quality." },
    { name: "Project Management", desc: "End-to-end planning, supervision, quality and cost control." },
    { name: "Equipment & Fleet", desc: "Heavy equipment and fleet services for construction and haulage." },
  ] as const,
};