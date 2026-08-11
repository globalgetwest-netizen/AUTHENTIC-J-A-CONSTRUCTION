import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * GET /api/verify/employee-id/photo?card=…&t=… — streams the card holder's
 * headshot for the public verify page. The API gates this with the exact same
 * card-number + embedded-token check as verification itself, so only a live QR
 * scan can see the photo — there is no open directory of worker photos.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const card = url.searchParams.get("card") ?? "";
  const t = url.searchParams.get("t") ?? "";
  const file = await apiFetch(
    `/employee-ids/verify/photo?card=${encodeURIComponent(card)}&t=${encodeURIComponent(t)}`,
  );
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
