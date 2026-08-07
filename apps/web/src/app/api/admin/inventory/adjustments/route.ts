import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const res = await apiFetch("/inventory/adjustments", { method: "POST", body });
  return toNext(res);
}
