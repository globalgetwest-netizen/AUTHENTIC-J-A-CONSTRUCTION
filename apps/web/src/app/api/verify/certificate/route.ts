import { verifyCertificate } from "@/lib/documents/verify";

export const runtime = "nodejs";

/**
 * Public certificate QR verification — stateless HMAC check, no auth token.
 * A scanner hits `…/verify/certificate?p=<payload>&s=<signature>`, both of
 * which came pre-encoded in the QR printed on the certificate.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const payload = url.searchParams.get("p") ?? "";
  const signature = url.searchParams.get("s") ?? "";
  return Response.json(verifyCertificate(payload, signature), {
    headers: { "cache-control": "no-store" },
  });
}