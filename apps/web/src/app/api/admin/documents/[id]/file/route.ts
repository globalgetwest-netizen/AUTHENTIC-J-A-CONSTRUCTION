import { apiFetch, getApiBase } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * GET /api/admin/documents/:id/file — streams the stored document from the API
 * uploads directory so the browser only ever talks to the web app. No
 * /api/v1 prefix: uploads are served statically off the API root.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/documents/[id]/file">) {
  const { id } = await ctx.params;
  const detail = await apiFetch(`/documents/${id}`);
  if (!detail.ok) return toNext(detail);

  const document = (await detail.json()) as { fileUrl?: string; title?: string };
  if (!document.fileUrl) {
    return new Response("No file on this document", { status: 404 });
  }

  const upstream = `${getApiBase()}${document.fileUrl}`;
  const file = await fetch(upstream, { cache: "no-store" });
  if (!file.ok) {
    return new Response(`Failed to fetch document (${file.status})`, { status: file.status });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const disposition = `inline; filename="${(document.title ?? "document").replace(/"/g, "")}"`;
  return new Response(buffer, {
    headers: {
      "Content-Type": file.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": disposition,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}