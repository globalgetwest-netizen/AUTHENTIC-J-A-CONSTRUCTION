import { AdminShell, type NavItem } from "./admin/AdminShell";

const STAFF_NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard" },
  { href: "/staff/projects", label: "Projects" },
  { href: "/staff/payslips", label: "My payslips" },
  { href: "/staff/employee-id", label: "My ID card" },
  { href: "/staff/profile", label: "My profile" },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell navItems={STAFF_NAV} areaLabel="Employee portal" signOutPath="/staff/login">
      {children}
    </AdminShell>
  );
}