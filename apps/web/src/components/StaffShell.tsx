import { AdminShell, type NavItem } from "./admin/AdminShell";
import type { AdminNavSection } from "@/config/adminNav";

const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/projects", label: "Projects" },
  { href: "/staff/payslips", label: "My payslips" },
  { href: "/staff/employee-id", label: "My ID card" },
  { href: "/staff/profile", label: "My profile" },
];

/**
 * The employee portal shell. `sections` (department-aware grouped nav, from the
 * layout) is preferred; `STAFF_NAV` is the flat fallback so the portal still
 * renders if the department lookup fails.
 */
export function StaffShell({
  children,
  sections,
}: {
  children: React.ReactNode;
  sections?: AdminNavSection[];
}) {
  return (
    <AdminShell
      sections={sections}
      navItems={STAFF_NAV}
      areaLabel="Employee portal"
      signOutPath="/staff/login"
    >
      {children}
    </AdminShell>
  );
}
