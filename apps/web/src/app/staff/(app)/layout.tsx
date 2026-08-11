import { redirect } from "next/navigation";
import { getAccessToken, apiFetch } from "@/lib/admin/auth";
import { decodeAccessTokenRoles } from "@/lib/auth/token";
import { isStaff, isAdmin } from "@/lib/auth/roles";
import { StaffShell } from "@/components/StaffShell";
import { staffSections } from "@/config/staffNav";

export default async function StaffAppLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/staff/login");

  const roles = decodeAccessTokenRoles(token) ?? [];
  if (!isStaff(roles)) {
    redirect(isAdmin(roles) ? "/admin" : "/staff/login");
  }

  // Resolve the member's department so the sidebar shows the work their
  // department performs (plus the always-on self-service items).
  let departmentCode: string | null = null;
  try {
    const res = await apiFetch("/staff/profile");
    if (res.ok) {
      const body = (await res.json().catch(() => null)) as {
        employee?: { department?: { code?: string | null } | null } | null;
      } | null;
      departmentCode = body?.employee?.department?.code ?? null;
    }
  } catch {
    departmentCode = null;
  }

  return <StaffShell sections={staffSections(departmentCode)}>{children}</StaffShell>;
}
