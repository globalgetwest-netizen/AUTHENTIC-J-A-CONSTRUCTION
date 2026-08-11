import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless certificate verification.
 *
 * Every issued certificate carries a QR that encodes a signed URL:
 *   <BASE>/verify/certificate?p=<payload>&s=<signature>
 * where `payload` is `base64url(serial|issuedOn|kind)` and `signature` is an
 * HMAC-SHA256 over that payload with the server secret. No database is needed —
 * a valid payload+signature pair can only be produced by someone who holds the
 * secret, so the printed certificate's QR is self-authenticating and any
 * alteration to the serial/date breaks the signature.
 *
 * See also [`employeeIdVerifyUrl`] in `pdf.ts`, which uses the DB-backed staff
 * card registry for worker ID cards. This module covers the document suite.
 *
 * Production note: set `CERT_VERIFY_SECRET` (Vercel/Render env) to a long random
 * value and keep it stable for the life of issued certificates.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const SECRET = process.env.CERT_VERIFY_SECRET ?? "ajac-dev-cert-verify-secret";

export type CertificateKind = "COE" | "AOC" | "PCC" | "CTO";

export const CERTIFICATE_KIND_LABELS: Record<CertificateKind, string> = {
  COE: "Certificate of Employment",
  AOC: "Certificate of Ownership",
  PCC: "Certificate of Practical Completion",
  CTO: "Certificate of Property Ownership",
};

function hmac(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest().toString("base64url");
}

/** base64url-encodes the `serial|issuedOn|kind` triple embedded in the QR. */
export function certificatePayload(
  serial: string,
  issuedOn: string,
  kind: CertificateKind,
): string {
  return Buffer.from(`${serial}|${issuedOn}|${kind}`, "utf8").toString("base64url");
}

/** Signature over the payload — recompute server-side to verify. */
export function certificateSignature(payload: string): string {
  return hmac(SECRET, payload);
}

/** Absolute URL a scanned certificate QR points at (public verify page). */
export function certificateVerifyUrl(
  serial: string,
  issuedOn: string,
  kind: CertificateKind,
): string {
  const p = certificatePayload(serial, issuedOn, kind);
  const s = certificateSignature(p);
  return `${BASE_URL}/verify/certificate?p=${encodeURIComponent(p)}&s=${encodeURIComponent(s)}`;
}

export interface CertificateVerifyResult {
  ok: boolean;
  serial?: string;
  issuedOn?: string;
  kind?: string;
  certificateType?: string;
  message?: string;
}

/**
 * Verifies a QR's `p` (payload) + `s` (signature) pair.
 * Provided by the public `/api/verify/certificate` route.
 */
export function verifyCertificate(
  payloadParam: string,
  signatureParam: string,
): CertificateVerifyResult {
  if (!payloadParam || !signatureParam) {
    return { ok: false, message: "A certificate QR is required to verify." };
  }

  const expected = Buffer.from(certificateSignature(payloadParam));
  const received = Buffer.from(signatureParam, "utf8");
  const valid = expected.length === received.length && timingSafeEqual(expected, received);
  if (!valid) {
    return {
      ok: false,
      message:
        "This certificate could not be verified. The QR signature does not match, which may mean the document was altered after issue.",
    };
  }

  const decoded = Buffer.from(payloadParam, "base64url").toString("utf8");
  const [serial, issuedOn, kindRaw] = decoded.split("|");
  const kind = (kindRaw ?? "") as CertificateKind;
  return {
    ok: true,
    serial,
    issuedOn,
    kind,
    certificateType: CERTIFICATE_KIND_LABELS[kind] ?? "Official Certificate",
  };
}