"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@ajac/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  deductionsBreakdown,
  formatDate,
  formatMoney,
  fullName,
  type PayrollRun,
} from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export default function PayrollRunDetailPage() {
  const { id, runId } = useParams<{ id: string; runId: string }>();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gross, setGross] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/payrolls/${runId}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (PayrollRun & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this payroll run.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setRun(record);
          setGross(record.grossPay != null ? String(record.grossPay) : "");
          setError("");
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
  }, [runId]);

  const breakdown = useMemo(() => deductionsBreakdown(run?.deductions ?? null), [run]);

  async function saveGross(e: React.FormEvent) {
    e.preventDefault();
    if (!run) return;
    if (gross === "" || Number(gross) < 0) return setMessage("Enter a valid gross amount.");
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/payrolls/${run.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grossPay: Number(gross) }),
      });
      const body = (await res.json().catch(() => null)) as
        | ({ id?: string; message?: string } & Partial<PayrollRun>)
        | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save changes.");
      const freshId = body?.id ?? run.id;
      const fresh = await fetch(`/api/admin/payrolls/${freshId}`, { cache: "no-store" });
      const freshBody = (await fresh.json().catch(() => null)) as PayrollRun | null;
      if (fresh.ok && freshBody?.id) {
        setRun(freshBody);
        setGross(freshBody.grossPay != null ? String(freshBody.grossPay) : "");
      }
      setMessage("Gross updated. Deductions and net were recomputed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!run) {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/payrolls/${id}`}
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to pay period
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Payroll run not found."}
        </p>
      </div>
    );
  }

  const employee = fullName(run.employee);
  const isDraft = run.status === "DRAFT";

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href={`/admin/payrolls/${id}`}
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to pay period
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{employee}</h1>
          <p className="text-sm text-neutral-500">
            Payroll run · {run.period?.name ?? formatDate(run.createdAt)}
          </p>
        </div>
        <StatusBadge value={run.status} />
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Employee">{employee} ({run.employee?.employeeCode ?? "—"})</DetailRow>
          <DetailRow label="Department">{run.employee?.department?.name ?? "—"}</DetailRow>
          <DetailRow label="Position">{run.employee?.position?.title ?? "—"}</DetailRow>
          <DetailRow label="Gross pay">{formatMoney(run.grossPay)}</DetailRow>
          <DetailRow label="SSNIT (employee)">
            {breakdown ? formatMoney(breakdown.ssnit) : "—"}
          </DetailRow>
          <DetailRow label="PAYE">{breakdown ? formatMoney(breakdown.paye) : "—"}</DetailRow>
          <DetailRow label="Total deductions">
            {breakdown ? formatMoney(breakdown.total) : "—"}
          </DetailRow>
          <DetailRow label="Net pay">
            <span className="font-semibold text-brand-blue">{formatMoney(run.netPay)}</span>
          </DetailRow>
          {run.processedAt && (
            <DetailRow label="Processed on">{formatDate(run.processedAt)}</DetailRow>
          )}
        </dl>
      </div>

      {isDraft && (
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Adjust gross pay</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Changes only apply while the run is DRAFT. SSNIT, PAYE and net are recomputed
            from the adjusted gross on save.
          </p>
          <form onSubmit={saveGross} className="space-y-4">
            <div className="max-w-xs">
              <label className={labelClass} htmlFor="run-gross">Gross pay (GHS) *</label>
              <input
                id="run-gross"
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={busy}>Save changes</Button>
              <a
                href={`/admin/payrolls/${id}`}
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}