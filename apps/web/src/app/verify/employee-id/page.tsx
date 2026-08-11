"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@ajac/ui";
import { Logo } from "@/components/Logo";
import { COMPANY } from "@/config/company";
import {
  formatDate,
  label,
  toneFor,
  type EmployeeIdVerifyResult,
} from "@/lib/admin/types";

function VerifyCard() {
  const searchParams = useSearchParams();
  const cardParam = searchParams.get("card") ?? "";
  const token = searchParams.get("t") ?? "";

  const [card, setCard] = useState(cardParam);
  const [t, setT] = useState(token);
  const [result, setResult] = useState<EmployeeIdVerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!card.trim() || !t.trim()) {
      setError("A valid card QR is required to verify.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setDone(false);
    try {
      const res = await fetch("/api/verify/employee-id", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ card: card.trim(), t: t.trim() }),
      });
      const body = (await res.json().catch(() => null)) as
        | (EmployeeIdVerifyResult & { message?: string })
        | { message?: string }
        | null;
      if (!res.ok) throw new Error((body as { message?: string } | null)?.message ?? "Verification failed.");
      setResult(body as EmployeeIdVerifyResult);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-verify when both params arrive in the URL from a scanned QR.
  // Verification is deferred off the synchronous effect body so the state
  // produced by the fetch does not cascade mid-render.
  useEffect(() => {
    if (!cardParam || !token || done || loading) return;
    const timer = window.setTimeout(() => {
      void verify();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardParam, token]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Logo width={40} />
        <div className="text-center">
          <div className="text-base font-bold text-neutral-900">{COMPANY.shortName}</div>
          <div className="text-xs text-neutral-500">Employee ID verification</div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {!done ? (
          <form onSubmit={verify} className="space-y-4">
            <h1 className="text-lg font-bold text-neutral-900">Verify a staff ID</h1>
            <p className="text-sm text-neutral-500">
              Scan the card&apos;s QR code to confirm the holder against our staff directory.
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="v-card">
                Card number
              </label>
              <input
                id="v-card"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700" htmlFor="v-t">
                Verification token
              </label>
              <input
                id="v-t"
                value={t}
                onChange={(e) => setT(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
              />
            </div>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            {result ? (
              <>
                {result.employee?.photoUrl && card.trim() && t.trim() ? (
                  <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-brand-blue">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local proxy stream, not remote */}
                    <img
                      src={`/api/verify/employee-id/photo?card=${encodeURIComponent(card.trim())}&t=${encodeURIComponent(t.trim())}`}
                      alt="Card holder headshot"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <Badge tone={toneFor(result.result)} soft>
                  {label(result.result)}
                </Badge>
                <h2 className="mt-4 text-2xl font-bold text-neutral-900">
                  {result.employee?.name ?? "No employee linked"}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">Staff code {result.employee?.employeeCode ?? "—"}</p>

                <div className="mt-5 divide-y divide-neutral-100 text-left">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-neutral-500">Department</span>
                    <span className="font-medium text-neutral-900">{result.employee?.department ?? "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-neutral-500">Position</span>
                    <span className="font-medium text-neutral-900">{result.employee?.position ?? "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-neutral-500">Issued</span>
                    <span className="font-medium text-neutral-900">
                      {result.issuedAt ? formatDate(result.issuedAt) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-neutral-500">Expires</span>
                    <span className="font-medium text-neutral-900">
                      {result.expiresAt ? formatDate(result.expiresAt) : "No expiry"}
                    </span>
                  </div>
                </div>

                {result.result === "INVALID" && (
                  <p className="mt-4 text-sm text-neutral-500">
                    This QR does not match a live staff card. Please ask the holder to visit HR.
                  </p>
                )}
                {result.result === "REVOKED" && (
                  <p className="mt-4 text-sm text-red-600">
                    This card has been revoked. Ask the holder to obtain a new ID.
                  </p>
                )}
                {result.result === "EXPIRED" && (
                  <p className="mt-4 text-sm text-amber-700">
                    This card has expired. Ask the holder to renew it.
                  </p>
                )}
                {result.result === "VERIFIED" && (
                  <p className="mt-4 text-sm text-emerald-700">
                    This card is valid and matches an active member of staff.
                  </p>
                )}

                <button
                  onClick={() => { setDone(false); setResult(null); }}
                  className="mt-6 text-sm font-semibold text-brand-blue hover:underline"
                >
                  Verify another card
                </button>
              </>
            ) : (
              <p className="text-sm text-neutral-500">No verification result.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmployeeIdPage() {
  return (
    <Suspense fallback={null}>
      <VerifyCard />
    </Suspense>
  );
}