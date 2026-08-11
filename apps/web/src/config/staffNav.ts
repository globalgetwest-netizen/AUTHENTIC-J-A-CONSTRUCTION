import type { AdminNavSection } from "@/config/adminNav";

/**
 * Employee portal navigation — grouped by the signed-in member's department.
 *
 * Each core department gets its own "work" section (the records they operate
 * day-to-day); every member always keeps the self-service section (dashboard,
 * payslips, ID card, profile). `staffSections(departmentCode)` is called from
 * the staff layout with the department resolved from `/staff/profile`, so a
 * Stores storekeeper sees Stores & Inventory while a Finance cashier sees
 * Finance & Accounts.
 *
 * The grouped shape matches the admin sidebar (`AdminShell` `sections`); the
 * always-on items also fall back to a flat nav when no sections are supplied.
 */

const OVERVIEW_SECTION: AdminNavSection = {
  id: "overview",
  label: "Overview",
  icon: "command-center",
  items: [
    { label: "Dashboard", href: "/staff" },
    { label: "Projects", href: "/staff/projects" },
  ],
};

const SELF_SERVICE_SECTION: AdminNavSection = {
  id: "self-service",
  label: "Self-service",
  icon: "documents",
  items: [
    { label: "My payslips", href: "/staff/payslips" },
    { label: "My ID card", href: "/staff/employee-id" },
    { label: "My profile", href: "/staff/profile" },
  ],
};

const PROJECTS_WORK: AdminNavSection = {
  id: "projects-work",
  label: "Projects",
  icon: "projects",
  items: [{ label: "Projects", href: "/staff/projects" }],
};

const STORES_WORK: AdminNavSection = {
  id: "stores-work",
  label: "Stores & Inventory",
  icon: "stores",
  items: [
    { label: "Inventory", href: "/staff/inventory" },
    { label: "Inventory transactions", href: "/staff/inventory-transactions" },
    { label: "Stock movements", href: "/staff/stock-movements" },
  ],
};

const PROCUREMENT_WORK: AdminNavSection = {
  id: "procurement-work",
  label: "Procurement",
  icon: "procurement",
  items: [{ label: "Materials", href: "/staff/materials" }],
};

const FINANCE_WORK: AdminNavSection = {
  id: "finance-work",
  label: "Finance & Accounts",
  icon: "finance",
  items: [
    { label: "Expenses", href: "/staff/expenses" },
    { label: "Receipts", href: "/staff/receipts" },
  ],
};

const PLANT_WORK: AdminNavSection = {
  id: "plant-work",
  label: "Plant & Equipment",
  icon: "plant",
  items: [{ label: "Maintenance", href: "/staff/maintenance" }],
};

const BLOCK_FACTORY_WORK: AdminNavSection = {
  id: "block-factory-work",
  label: "Block Production",
  icon: "manufacturing",
  items: [{ label: "Block production", href: "/staff/block-productions" }],
};

/** Department business code → the operational work that department performs. */
const DEPARTMENT_WORK: Record<string, AdminNavSection[]> = {
  "DPT-PROJECTS": [PROJECTS_WORK],
  "DPT-STORES": [STORES_WORK],
  "DPT-PROCUREMENT": [PROCUREMENT_WORK],
  "DPT-FINANCE": [FINANCE_WORK],
  "DPT-PLANT": [PLANT_WORK],
  "DPT-BLOCKFACTORY": [BLOCK_FACTORY_WORK],
};

/** The base navigation every member sees, regardless of department. */
export const STAFF_BASE_SECTIONS: AdminNavSection[] = [OVERVIEW_SECTION, SELF_SERVICE_SECTION];

/** Grouped sidebar for a member of the given department (code from `/staff/profile`). */
export function staffSections(departmentCode: string | null | undefined): AdminNavSection[] {
  const work = departmentCode ? DEPARTMENT_WORK[departmentCode] ?? [] : [];
  return [...work, ...STAFF_BASE_SECTIONS];
}
