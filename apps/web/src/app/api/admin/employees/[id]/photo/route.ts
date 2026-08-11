import { apiFetch } from "@/lib/admin/auth";
import { toNext } from "@/lib/admin/resources";

/**
 * GET /api/admin/employees/:id/photo — streams the worker headshot from the API
 * (employees.read) so the browser only ever talks to the web app.
 * POST /api/admin/employees/:id/photo — forwards a multipart upload (`photo`)
 * which the API validates, stores under uploads/employees and links to the
 * employee record (employees.write).
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/employees/[id]/photo">) {
  const { id } = await ctx.params;
  const file = await apiFetch(`/employees/${id}/photo`);
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

export async function POST(req: Request, ctx: RouteContext<"/api/admin/employees/[id]/photo">) {
  const { id } = await ctx.params;
  const body = await req.formData();
  const res = await apiFetch(`/employees/${id}/photo`, { method: "POST", body });
  return toNext(res);
}
