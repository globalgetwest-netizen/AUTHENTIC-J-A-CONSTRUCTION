"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@ajac/ui";
import { toDataURL } from "qrcode";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  formatDateTime,
  idFullName,
  label,
  type EmployeeIdCard,
  type VerificationRecord,
} from "@/lib/admin/types";

const labelClass = "block text-sm font-medium text-neutral-700";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function EmployeeIdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<EmployeeIdCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [qr, setQr] = useState("");
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/employee-ids/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (EmployeeIdCard & { message?: string })
          | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this card.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setCard(record);
          setError("");
          if (record.cardNumber && record.qrToken) {
            const url = `${window.location.origin}/verify/employee-id?card=${encodeURIComponent(
              record.cardNumber,
            )}&t=${encodeURIComponent(record.qrToken)}`;
            toDataURL(url, {
              errorCorrectionLevel: "M",
              margin: 1,
              width: 220,
              color: { dark: "#0f172a", light: "#ffffff" },
            })
              .then(setQr)
              .catch(() => setQr(""));
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function revoke() {
    if (!card) return;
    if (!window.confirm(`Mark ${card.cardNumber} as REVOKED? The employee will need a new card issued.`)) return;
    setRevoking(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/employee-ids/${card.id}/revoke`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not revoke the card.");
      setCard((prev) => (prev ? { ...prev, status: "REVOKED" } : prev));
      setMessage(`Card ${card.cardNumber} is now REVOKED.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not revoke the card.");
    } finally {
      setRevoking(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/admin/employee-ids"
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to employee IDs
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Could not load this card."}
        </p>
      </div>
    );
  }

  const verifications: VerificationRecord[] = card.verifications ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/employee-ids"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to employee IDs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{idFullName(card.employee)}</h1>
          <p className="text-sm text-neutral-500">{card.cardNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/employee-ids/${card.id}/card`}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Download ID card (PDF)
          </a>
          <Link
            href={`/admin/employee-ids/${card.id}/edit`}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
          >
            Edit
          </Link>
          <Button
            variant="danger"
            loading={revoking}
            onClick={revoke}
            disabled={card.status === "REVOKED"}
          >
            {card.status === "REVOKED" ? "Revoked" : "Revoke"}
          </Button>
        </div>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
          <dl className="divide-y divide-neutral-100">
            <DetailRow label="Status">
              <StatusBadge value={card.status} />
            </DetailRow>
            <DetailRow label="ID type">
              <span className="font-semibold text-neutral-900">{card.idType}</span>
            </DetailRow>
            <DetailRow label="Holder">
              {card.employee ? idFullName(card.employee) : (card.holderName ?? "—")}
            </DetailRow>
            <DetailRow label="Staff code">
              {card.employee?.employeeCode ?? (card.holderName ? "—" : "—")}
            </DetailRow>
            <DetailRow label="Position">
              {card.employee?.position?.title ?? card.position ?? "—"}
            </DetailRow>
            <DetailRow label="Department">
              {card.employee?.department?.name ?? card.department ?? "—"}
            </DetailRow>
            <DetailRow label="Contact">
              {[card.contactPhone, card.contactEmail].filter(Boolean).join(" · ") || "—"}
            </DetailRow>
            <DetailRow label="Branch">{card.employee?.branch?.name ?? "—"}</DetailRow>
            <DetailRow label="Issued">{formatDate(card.issuedAt)}</DetailRow>
            <DetailRow label="Expires">
              {card.expiresAt ? formatDate(card.expiresAt) : "No expiry"}
            </DetailRow>
          </dl>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          {card.employee?.photoUrl && (
            <div className="mb-4 text-center">
              <p className={labelClass}>Worker photo</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- local proxy stream, not remote */}
              <img
                src={`/api/admin/employees/${card.employee.id}/photo`}
                alt={`${idFullName(card.employee)} headshot`}
                className="mt-2 h-28 w-28 rounded-full border border-neutral-200 object-cover"
              />
            </div>
          )}
          <p className={labelClass}>Scan to verify</p>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- data-URI from `qrcode`, not a remote/bundled image
            <img
              src={qr}
              alt="Employee ID QR code"
              className="mt-2 h-auto w-full rounded-md"
            />
          ) : (
            <p className="mt-2 text-sm text-neutral-400">QR unavailable (card has no token).</p>
          )}
          <p className="mt-3 text-xs text-neutral-400">
            Anyone with the QR can open the public verify page and confirm this identity.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Verification history</h2>
        {verifications.length === 0 ? (
          <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
            No QR scans recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                  <th className="py-2 pr-4 font-medium">Result</th>
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 pr-4 font-medium">IP address</th>
                  <th className="py-2 font-medium">Verified at</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 pr-4"><StatusBadge value={v.result} /></td>
                    <td className="py-2 pr-4">{label(v.method) || "—"}</td>
                    <td className="py-2 pr-4 text-neutral-500">{v.ipAddress || "—"}</td>
                    <td className="py-2 text-neutral-500">{formatDateTime(v.verifiedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}