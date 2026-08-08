import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** GET /api/notifications/unread-count — badge value for the bell. */
export async function GET() {
  const res = await apiFetch("/notifications/unread-count");
  return toNext(res);
}