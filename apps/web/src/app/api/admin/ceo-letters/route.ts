import { apiFetch } from "@/lib/admin/auth";
import { renderCeoLetterPdf, type CeoLetterInput } from "@/lib/documents/pdf";

export const runtime = "nodejs";

/**
 * POST /api/admin/ceo-letters — renders an official CEO & Founder letter from
 * composed input (recipient, subject, body) to a letterhead PDF.
 *
 * Unlike record-scoped documents, a CEO letter is free-form text written by
 * the admin, so there is no backend resource to fetch — the body carries the
 * full letter. The route validates the admin session against the API's
 * /auth/me endpoint (same gate the record-scoped PDF routes rely on).
 */
export async function POST(req: Request) {
  const session = await apiFetch("/auth/me");
  if (!session.ok) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: session.status,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const letter = body as Partial<CeoLetterInput>;
  const errors: string[] = [];
  if (!letter.refNo?.trim()) errors.push("Reference number is required.");
  if (!letter.recipient?.trim()) errors.push("Recipient is required.");
  if (!letter.subject?.trim()) errors.push("Subject is required.");
  if (!Array.isArray(letter.paragraphs) || letter.paragraphs.length === 0) {
    errors.push("At least one body paragraph is required.");
  } else if (letter.paragraphs.some((p) => typeof p !== "string" || !p.trim())) {
    errors.push("Every paragraph must be non-empty text.");
  }
  if (errors.length) {
    return new Response(JSON.stringify({ message: errors.join(" ") }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const pdf = await renderCeoLetterPdf({
    refNo: letter.refNo!.trim(),
    date: letter.date,
    recipient: letter.recipient!.trim(),
    recipientAddress: letter.recipientAddress?.trim() || undefined,
    salutation: letter.salutation?.trim() || undefined,
    subject: letter.subject!.trim(),
    paragraphs: letter.paragraphs!.map((p) => p.trim()),
    includeStamp: letter.includeStamp,
    includeSignature: letter.includeSignature,
  });

  const safe = letter.refNo!.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${safe || "ceo-letter"}.pdf"`,
    },
  });
}
