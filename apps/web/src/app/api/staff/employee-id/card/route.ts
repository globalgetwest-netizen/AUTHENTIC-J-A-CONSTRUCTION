import { apiFetch } from "@/lib/admin/auth";
import { renderEmployeeIdCardPdf } from "@/lib/documents/pdf";
import type { EmployeeIdCard } from "@/lib/admin/types";

export const runtime = "nodejs";

export async function GET() {
  const res = await apiFetch("/staff/employee-id");
  if (!res.ok) {
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  }

  const card = (await res.json()) as EmployeeIdCard | null;
  if (!card) {
    return new Response(JSON.stringify({ ok: false, error: "No ID card issued for you yet." }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const pdf = await renderEmployeeIdCardPdf({ card });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="my-employee-id-${card.cardNumber}.pdf"`,
    },
  });
}