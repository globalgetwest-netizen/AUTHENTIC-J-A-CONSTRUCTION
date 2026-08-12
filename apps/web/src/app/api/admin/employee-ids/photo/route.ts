import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * POST /api/admin/employee-ids/photo — forwards a multipart upload (`photo`)
 * which the API validates, stores under uploads/employees and returns its
 * `/uploads/...` URL. The URL is then saved against the issued card.
 */
export async function POST(req: Request) {
  const body = await req.formData();
  const res = await apiFetch("/employee-ids/photo", { method: "POST", body });
  return toNext(res);
}
