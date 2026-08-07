import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/admin/auth";
import { decodeAccessTokenRoles } from "@/lib/auth/token";
import { isStaff, isAdmin } from "@/lib/auth/roles";
import { StaffShell } from "@/components/StaffShell";

export default async function StaffAppLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/staff/login");

  const roles = decodeAccessTokenRoles(token) ?? [];
  if (!isStaff(roles)) {
    redirect(isAdmin(roles) ? "/admin" : "/staff/login");
  }

  return <StaffShell>{children}</StaffShell>;
}