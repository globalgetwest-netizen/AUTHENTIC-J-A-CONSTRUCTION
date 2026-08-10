"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { QuotationForm } from "@/components/admin/QuotationForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  formatMoney,
  label,
  QUOTATION_STATUSES,
  type Quotation,
} from "@/lib/admin/types";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{label}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/quotations/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Quotation & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this quotation.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setQuotation(record);
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
  }, [id]);

  async function changeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!quotation || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setQuotation({ ...quotation, status: next as Quotation["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!quotation) return;
    if (!window.confirm("Delete this quotation? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/quotations/${quotation.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string };
      setMessage(body?.message ?? "Could not delete quotation.");
      return;
    }
    router.push("/admin/quotations");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div>
        <Link href="/admin/quotations" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to quotations
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Quotation not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit quotation {quotation.quotationNo}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <QuotationForm initial={quotation} quotationId={quotation.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/quotations" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to quotations
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{quotation.title}</h1>
          <StatusBadge value={quotation.status} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/quotations/${quotation.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Download PDF
          </a>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Quote No.">
            <span className="font-medium text-neutral-900">{quotation.quotationNo}</span>
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={quotation.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {QUOTATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Client">
            {quotation.client?.companyName || quotation.client?.contactName || "—"}
          </DetailRow>
          <DetailRow label="Project">{quotation.project?.name || "—"}</DetailRow>
          <DetailRow label="Issued">{formatDate(quotation.issuedAt ?? quotation.createdAt)}</DetailRow>
          <DetailRow label="Valid until">{formatDate(quotation.validUntil)}</DetailRow>
          <DetailRow label="Currency">{quotation.currency}</DetailRow>
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900">
          Line items
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-5 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Unit price</th>
              <th className="px-5 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {quotation.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-2.5 text-neutral-900">{item.description}</td>
                <td className="px-3 py-2.5 text-right text-neutral-700">{String(Number(item.quantity))}</td>
                <td className="px-3 py-2.5 text-right text-neutral-700">{formatMoney(item.unitPrice)}</td>
                <td className="px-5 py-2.5 text-right font-medium text-neutral-900">
                  {formatMoney(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col items-end gap-1 border-t border-neutral-100 px-5 py-3 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-medium text-neutral-900">{formatMoney(quotation.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-neutral-500">VAT</span>
            <span className="font-medium text-neutral-900">{formatMoney(quotation.tax)}</span>
          </div>
          {Number(quotation.discount) > 0 ? (
            <div className="flex justify-between gap-8">
              <span className="text-neutral-500">Discount</span>
              <span className="font-medium text-neutral-900">- {formatMoney(quotation.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-8 border-t border-neutral-200 pt-2 text-base font-bold text-brand-blue">
            <span>Total</span>
            <span>{formatMoney(quotation.total)}</span>
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={remove}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Delete quotation
      </button>
    </div>
  );
}