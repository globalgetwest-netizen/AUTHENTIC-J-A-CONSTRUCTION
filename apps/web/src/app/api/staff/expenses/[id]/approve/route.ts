import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/** POST /api/staff/expenses/:id/approve — department head / admin approves a PENDING expense. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await apiFetch(`/staff/expenses/${id}/approve`, { method: "POST" });
  return toNext(res);
}
