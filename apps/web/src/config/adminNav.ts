import type { NavIconName } from "@/components/admin/nav-icons";

/**
 * Admin sidebar navigation — the single source of truth for what the left
 * rail renders and the grouping (department) each module lives under.
 *
 * This file is read-only data powering the shell; the shell (AdminShell) does
 * the rendering. Every `href` MUST match an existing route (see the route
 * folders under `src/app/admin/(app)/`).
 *
 * Permission model:
 * - `permission` carries the backend permission code (from the seed catalog,
 *   `services/api/src/seed/seed.ts`) the user must hold to SEE the item.
 * - Phase 1 renders the full tree for admins; Phase 2 wires the sidebar to
 *   the user's permissions and filters on this field. Codes are recorded now
 *   so that later step is a pure data/plumbing change.
 * - Items without a module in the catalog (e.g. detail/list modules like
 *   `warehouses`) deliberately omit `permission`; they group under their
 *   parent module's gate.
 */

export interface AdminNavItem {
  label: string;
  href: string;
  permission?: string;
}

export interface AdminNavSection {
  id: string;
  label: string;
  icon: NavIconName;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    id: "command-center",
    label: "Command Center",
    icon: "command-center",
    items: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    id: "governance",
    label: "Organization",
    icon: "governance",
    items: [{ label: "Org structure", href: "/admin/org", permission: "org.read" }],
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: "commercial",
    items: [
      { label: "Leads", href: "/admin/leads", permission: "leads.read" },
      { label: "Clients", href: "/admin/clients", permission: "clients.read" },
      { label: "Quotations", href: "/admin/quotations", permission: "quotations.read" },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    icon: "projects",
    items: [{ label: "Projects", href: "/admin/projects", permission: "projects.read" }],
  },
  {
    id: "engineering",
    label: "Engineering",
    icon: "engineering",
    items: [{ label: "Engineering & technical", href: "/admin/engineering" }],
  },
  {
    id: "quantity-surveying",
    label: "Quantity Surveying",
    icon: "quantity-surveying",
    items: [{ label: "QS & contracts", href: "/admin/quantity-surveying" }],
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: "procurement",
    items: [
      { label: "Materials", href: "/admin/materials", permission: "materials.read" },
      { label: "Material categories", href: "/admin/material-categories" },
    ],
  },
  {
    id: "stores",
    label: "Stores & Inventory",
    icon: "stores",
    items: [
      { label: "Warehouses", href: "/admin/warehouses" },
      { label: "Inventory", href: "/admin/inventory" },
      { label: "Inventory transactions", href: "/admin/inventory-transactions" },
      { label: "Stock movements", href: "/admin/stock-movements" },
    ],
  },
  {
    id: "manufacturing",
    label: "Block Production",
    icon: "manufacturing",
    items: [
      { label: "Block products", href: "/admin/block-products" },
      { label: "Block production", href: "/admin/block-productions" },
      { label: "Block sales", href: "/admin/block-sales" },
    ],
  },
  {
    id: "plant",
    label: "Plant & Equipment",
    icon: "plant",
    items: [
      { label: "Equipment & assets", href: "/admin/equipment", permission: "equipment.read" },
      { label: "Maintenance", href: "/admin/maintenance" },
      { label: "Assets", href: "/admin/assets" },
      { label: "Asset assignments", href: "/admin/asset-assignments" },
    ],
  },
  {
    id: "fleet",
    label: "Vehicles & Fleet",
    icon: "fleet",
    items: [{ label: "Vehicles", href: "/admin/vehicles" }],
  },
  {
    id: "property",
    label: "Property & Land",
    icon: "property",
    items: [
      { label: "Properties", href: "/admin/properties", permission: "properties.read" },
      { label: "Property sales", href: "/admin/property-sales" },
      { label: "Property types", href: "/admin/property-types" },
      { label: "Land projects", href: "/admin/land-projects", permission: "land.read" },
      { label: "Land plots", href: "/admin/land-plots" },
      { label: "Land allocations", href: "/admin/land-allocations" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Accounts",
    icon: "finance",
    items: [
      { label: "Invoices", href: "/admin/invoices", permission: "finance.read" },
      { label: "Receipts", href: "/admin/receipts" },
      { label: "Expenses", href: "/admin/expenses" },
      { label: "Transactions", href: "/admin/financial-transactions" },
      { label: "Payments", href: "/admin/payments" },
    ],
  },
  {
    id: "hr",
    label: "Human Resources",
    icon: "hr",
    items: [
      { label: "Employees", href: "/admin/employees", permission: "employees.read" },
      { label: "Employee IDs", href: "/admin/employee-ids", permission: "employee-ids.read" },
      { label: "Payrolls", href: "/admin/payrolls" },
      { label: "Payslips", href: "/admin/payslips" },
    ],
  },
  {
    id: "hse",
    label: "HSE & Quality",
    icon: "hse",
    items: [{ label: "Health, safety & quality", href: "/admin/hse" }],
  },
  {
    id: "documents",
    label: "Documents",
    icon: "documents",
    items: [
      { label: "Documents", href: "/admin/documents", permission: "documents.read" },
      { label: "Corporate documents", href: "/admin/corporate-documents" },
      { label: "CEO & Founder letter", href: "/admin/ceo-letters" },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: "reporting",
    items: [{ label: "Reporting & analytics", href: "/admin/reporting" }],
  },
];