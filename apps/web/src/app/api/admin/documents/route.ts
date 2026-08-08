import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = [
  "page",
  "pageSize",
  "sortBy",
  "sortOrder",
  "search",
  "status",
  "category",
] as const;

/** GET /api/admin/documents — the document library (documents.read). */
export async function GET(req: Request) {
  const res = await apiFetch(buildListUrl("/documents", FILTER_KEYS, req));
  return toNext(res);
}

/** POST /api/admin/documents — create a document from a file upload or URL. */
export async function POST(req: Request): Promise<Response> {
  const body = await req.formData();
  const res = await apiFetch("/documents", { method: "POST", body });
  return toNext(res);
}