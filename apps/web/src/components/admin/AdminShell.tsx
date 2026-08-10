"use client";

import { usePathname, useRouter } from "next/navigation";
import { COMPANY } from "../../config/company";
import { Logo } from "../Logo";
import { NotificationBell } from "./NotificationBell";
import { NavIcon } from "./nav-icons";
import type { AdminNavSection } from "@/config/adminNav";

export interface NavItem {
  href: string;
  label: string;
}

const DEFAULT_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/quotations", label: "Quotations" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/corporate-documents", label: "Corporate documents" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/employee-ids", label: "Employee IDs" },
  { href: "/admin/org", label: "Org structure" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/property-sales", label: "Property sales" },
  { href: "/admin/property-types", label: "Property types" },
  { href: "/admin/land-projects", label: "Land projects" },
  { href: "/admin/land-plots", label: "Land plots" },
  { href: "/admin/land-allocations", label: "Land allocations" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/material-categories", label: "Material categories" },
  { href: "/admin/warehouses", label: "Warehouses" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/inventory-transactions", label: "Inventory transactions" },
  { href: "/admin/stock-movements", label: "Stock movements" },
  { href: "/admin/block-products", label: "Block products" },
  { href: "/admin/block-productions", label: "Block production" },
  { href: "/admin/block-sales", label: "Block sales" },
  { href: "/admin/equipment", label: "Equipment & assets" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/maintenance", label: "Maintenance" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/asset-assignments", label: "Asset assignments" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/receipts", label: "Receipts" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/financial-transactions", label: "Transactions" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/payrolls", label: "Payrolls" },
  { href: "/admin/payslips", label: "Payslips" },
];

/**
 * The shell for every logged-in area (admin console, employee portal, client
 * portal). Renders the fixed left sidebar (brand, nav, footer), the sticky
 * header with the current page title + notification bell, and the content.
 *
 * Navigation comes in two shapes:
 * - `sections` (preferred): grouped sidebar with department labels + icons,
 *   as declared in `src/config/adminNav.ts`. Each item's `permission` field is
 *   reserved for Phase 2 sidebar filtering and is intentionally ignored here.
 * - `navItems` (legacy): a single flat section with no icons/group labels.
 *   Kept so StaffShell/ClientShell render byte-for-byte the same as before.
 */
export function AdminShell({
  children,
  navItems = DEFAULT_NAV,
  sections,
  areaLabel = "Admin console",
  signOutPath = "/admin/login",
}: {
  children: React.ReactNode;
  navItems?: NavItem[];
  sections?: AdminNavSection[];
  areaLabel?: string;
  signOutPath?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  /** First href acts as the "home" of this shell: exact match only. */
  const homeHref = sections?.[0]?.items?.[0]?.href ?? navItems[0]?.href;

  const isActive = (href: string) =>
    href === homeHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  async function signOut() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push(signOutPath);
    router.refresh();
  }

  // Active item = first item (across sections) whose href is active. Section
  // label comes from the section that contains the active item.
  let activeItem: NavItem | undefined;
  let activeSection: AdminNavSection | undefined;
  if (sections) {
    for (const s of sections) {
      const item = s.items.find((n) => isActive(n.href));
      if (item) {
        activeItem = item;
        activeSection = s;
        break;
      }
    }
  } else {
    activeItem = navItems.find((n) => isActive(n.href));
  }

  const title = activeItem?.label ?? areaLabel;
  const sectionLabel = activeSection?.label ?? pathname.split("/")[2] ?? "";

  return (
    <div className="min-h-screen bg-neutral-100">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-blue-950 text-white">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Logo width={40} inverted />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{COMPANY.shortName}</div>
            <div className="text-xs font-medium text-blue-200">{areaLabel}</div>
          </div>
        </div>

        <nav
          className={`flex-1 overflow-y-auto px-3 py-4 ${sections ? "space-y-6" : "space-y-1"}`}
        >
          {sections
            ? sections.map((section) => (
                <div key={section.id}>
                  <div className="mb-1 flex items-center gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-blue-300">
                    <NavIcon name={section.icon} className="h-3.5 w-3.5" />
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-brand-blue text-white"
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))
            : navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand-blue text-white"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            View public site
          </a>
          <button
            type="button"
            onClick={signOut}
            className="w-full rounded-md bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <div className="text-sm font-semibold text-neutral-800">{title}</div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 sm:flex">
              <span className="flex gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              {sectionLabel || "portal"}
            </span>
            <NotificationBell />
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}