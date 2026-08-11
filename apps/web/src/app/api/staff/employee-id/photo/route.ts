import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * GET /api/staff/employee-id/photo — streams the logged-in staff member's own
 * headshot (staff-scoped; no permission code required). Used for the photo on
 * the self-service "My ID card" page and the card PDF.
 */
export async function GET() {
  const file = await apiFetch("/staff/employee-id/photo");
  if (!file.ok) return toNext(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const disposition = file.headers.get("Content-Disposition") ?? 'inline; filename="photo"';
  return new Response(buffer, {
    headers: {
      "Content-Type": file.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
