import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function GET() {
  const res = await apiFetch("/client/profile");
  return toNext(res);
}