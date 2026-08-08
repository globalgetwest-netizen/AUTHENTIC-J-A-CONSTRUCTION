import { apiFetch } from "@/lib/admin/auth";
import { buildListUrl, toNext } from "@/lib/admin/resources";

const FILTER_KEYS = [
  "page",
  "pageSize",
  "search",
  "type",
  "unreadOnly",
  "sortBy",
  "sortOrder",
] as const;

/** GET /api/notifications — the signed-in user's notification feed. */
export async function GET(req: Request) {
  // Self-scoped: the API derives the userId from the bearer token, so any shell
  // (admin / staff / client) can reuse this endpoint.
  const res = await apiFetch(buildListUrl("/notifications", FILTER_KEYS, req));
  return toNext(res);
}

/** POST /api/notifications — mark all notifications as read. */
export async function POST(): Promise<Response> {
  const res = await apiFetch("/notifications/read-all", { method: "POST" });
  return toNext(res);
}