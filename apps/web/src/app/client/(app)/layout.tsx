import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/admin/auth";
import { decodeAccessTokenRoles } from "@/lib/auth/token";
import { isClient, isAdmin, isStaff } from "@/lib/auth/roles";
import { ClientShell } from "@/components/ClientShell";

export default async function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/client/login");

  const roles = decodeAccessTokenRoles(token) ?? [];
  if (!isClient(roles)) {
    redirect(isAdmin(roles) ? "/admin" : isStaff(roles) ? "/staff" : "/client/login");
  }

  return <ClientShell>{children}</ClientShell>;
}