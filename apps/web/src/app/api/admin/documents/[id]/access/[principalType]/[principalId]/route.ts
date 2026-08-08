import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * DELETE /api/admin/documents/:id/access/:principalType/:principalId
 * — revoke a specific principal's grant.
 */
export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/admin/documents/[id]/access/[principalType]/[principalId]">,
) {
  const { id, principalType, principalId } = await ctx.params;
  const res = await apiFetch(`/documents/${id}/access/${principalType}/${principalId}`, {
    method: "DELETE",
  });
  return toNext(res);
}