import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/admin/auth";
import { decodeAccessTokenRoles } from "@/lib/auth/token";
import { isAdmin, isStaff } from "@/lib/auth/roles";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV } from "@/config/adminNav";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/admin/login");

  const roles = decodeAccessTokenRoles(token) ?? [];
  if (!isAdmin(roles)) {
    // Signed in but not an admin: staff are routed to their portal, everyone else
    // back to the login screen. The API still enforces permissions downstream.
    redirect(isStaff(roles) ? "/staff" : "/admin/login");
  }

  return <AdminShell sections={ADMIN_NAV}>{children}</AdminShell>;
}