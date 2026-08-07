import { AdminShell, type NavItem } from "./admin/AdminShell";

const CLIENT_NAV: NavItem[] = [
  { href: "/client", label: "Dashboard" },
  { href: "/client/profile", label: "My profile" },
];

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell navItems={CLIENT_NAV} areaLabel="Client portal" signOutPath="/client/login">
      {children}
    </AdminShell>
  );
}