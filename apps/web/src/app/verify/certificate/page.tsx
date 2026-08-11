"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { COMPANY } from "@/config/company";
import type { CertificateVerifyResult } from "@/lib/documents/verify";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function VerifyCert() {
  const searchParams = useSearchParams();
  const payload = searchParams.get("p") ?? "";
  const signature = searchParams.get("s") ?? "";

  const [result, setResult] = useState<CertificateVerifyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!payload || !signature) {
      setError("A certificate QR is required to verify. Open it by scanning the code printed on the certificate.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/verify/certificate?p=${encodeURIComponent(payload)}&s=${encodeURIComponent(signature)}`,
      { cache: "no-store" },
    )
      .then((res) => res.json().catch(() => null))
      .then((body: CertificateVerifyResult | null) => {
        if (cancelled) return;
        setResult(body);
        setError(body && !body.ok ? body.message ?? "Verification failed." : "");
      })
      .catch(() => {
        if (!cancelled) setError("Verification failed. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [payload, signature]);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Logo width={40} />
        <div className="text-center">
          <div className="text-base font-bold text-neutral-900">{COMPANY.shortName}</div>
          <div className="text-xs text-neutral-500">Certificate verification</div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-neutral-500">Verifying certificate…</div>
        ) : error && !result?.ok ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              ✕
            </div>
            <h1 className="text-lg font-bold text-neutral-900">Unable to verify</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{error || "No verification result."}</p>
            <p className="mt-4 text-xs text-neutral-400">
              If you are verifying a physical document, please confirm the certificate number and
              contact AUTHENTIC J.A. CONSTRUCTION LTD. for assistance.
            </p>
          </div>
        ) : result?.ok ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
              ✓
            </div>
            <h1 className="text-lg font-bold text-emerald-700">Certificate verified</h1>
            <p className="mt-2 text-sm text-neutral-500">
              This document is an authentic <span className="font-medium text-neutral-800">{result.certificateType}</span>{""}
              issued by AUTHENTIC J.A. CONSTRUCTION LTD.
            </p>

            <div className="mt-6 divide-y divide-neutral-100 rounded-xl border border-neutral-200 text-left">
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-neutral-500">Certificate</span>
                <span className="font-medium text-neutral-900">{result.certificateType}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-neutral-500">Certificate no.</span>
                <span className="font-medium text-neutral-900">{result.serial ?? "—"}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-neutral-500">Issue date</span>
                <span className="font-medium text-neutral-900">{formatDate(result.issuedOn)}</span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-neutral-400">
              This confirms the certificate&apos;s authenticity against the company&apos;s issued
              document register. Any alteration to the certificate invalidates this verification.
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-neutral-500">No verification result.</div>
        )}
      </div>
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <Suspense fallback={null}>
      <VerifyCert />
    </Suspense>
  );
}