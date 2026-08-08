import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * GET /api/admin/documents/:id/file — streams a stored document from the API
 * so the browser only ever talks to the web app. The call goes through
 * `apiFetch`, which attaches the cookie bearer token; the API endpoint is
 * permission-gated (documents.read) and streams from the uploads directory.
 * There is no public /uploads mount on the API.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/documents/[id]/file">) {
  const { id } = await ctx.params;
  const file = await apiFetch(`/documents/${id}/file`);
  if (!file.ok) return toNext(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const disposition = file.headers.get("Content-Disposition") ?? 'inline; filename="document"';
  return new Response(buffer, {
    headers: {
      "Content-Type": file.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
