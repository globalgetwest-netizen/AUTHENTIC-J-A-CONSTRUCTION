import { NextResponse } from "next/server";
import { emailSchema, nameSchema, phoneSchema } from "@ajac/validation";
import { COMPANY, REQUEST_TYPES } from "../../../config/company";

interface SubmitBody {
  requestType: string;
  fullName: string;
  company?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  projectType?: string;
  service?: string;
  budgetRange?: string;
  preferredLocation?: string;
  description?: string;
  preferredContactMethod?: string;
  attachmentName?: string;
}

const ALLOWED_METHODS = new Set(["phone", "email", "whatsapp"]);

function msg(schema: { safeParse(v: unknown): { success: boolean; error?: { issues: { message?: string }[] } } }, value: unknown, fallback: string): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error?.issues?.[0]?.message ?? fallback;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't read your submission. Please try again." },
      { status: 400 },
    );
  }

  const VALID_TYPES = new Set<string>(Object.keys(REQUEST_TYPES));

  const errors: Record<string, string> = {};

  if (!body || !body.requestType || !VALID_TYPES.has(body.requestType)) {
    errors.requestType = "Please choose what you need.";
  }
  const nameErr = msg(nameSchema, body?.fullName, "Please enter your full name.");
  if (nameErr) errors.fullName = nameErr;
  const emailErr = msg(emailSchema, body?.email, "Please enter a valid email address.");
  if (emailErr) errors.email = emailErr;
  const phoneErr = msg(phoneSchema, body?.phone, "Please enter a valid phone number.");
  if (phoneErr) errors.phone = phoneErr;
  if (body?.whatsapp && body.whatsapp.length > 0 && msg(phoneSchema, body.whatsapp, "Check your WhatsApp number.")) {
    errors.whatsapp = "Check your WhatsApp number.";
  }
  if (body?.preferredContactMethod && !ALLOWED_METHODS.has(body.preferredContactMethod)) {
    errors.preferredContactMethod = "Choose how you'd like to be contacted.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const apiBase = process.env.API_PUBLIC_URL ?? "http://localhost:4000";
  let res: Response;
  try {
    res = await fetch(`${apiBase}/api/v1/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...body,
        requestType: body.requestType,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: `Our request service is temporarily unavailable. Please call us on ${COMPANY.phones[0]}.`,
      },
      { status: 503 },
    );
  }

  const data = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; message?: unknown } | null;
  if (!res.ok || !data?.ok) {
    return NextResponse.json(
      { ok: false, error: `We couldn't save your request right now. Please call us on ${COMPANY.phones[0]}.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, reference: data.reference }, { status: 201 });
}