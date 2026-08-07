"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { PropertySaleForm } from "@/components/admin/PropertySaleForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, label, SALE_STATUSES, type PropertySale } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function PropertySaleDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<PropertySale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/property-sales/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (PropertySale & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this sale.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setSale(record);
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
    if (!sale || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/property-sales/${sale.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setSale({ ...sale, status: next as PropertySale["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!sale) return;
    if (!window.confirm("Delete this sale? This cannot be undone.")) return;
    await fetch(`/api/admin/property-sales/${sale.id}`, { method: "DELETE" });
    router.push("/admin/property-sales");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div>
        <Link href="/admin/property-sales" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to property sales
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Sale not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit {sale.saleCode}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <PropertySaleForm initial={sale} saleId={sale.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/property-sales"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to property sales
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{sale.saleCode}</h1>
          <StatusBadge value={sale.status} />
        </div>
        <div className="flex items-center gap-2">
          {sale.status === "COMPLETED" ? (
            <a
              href={`/api/admin/property-sales/${sale.id}/certificate`}
              className="inline-flex items-center rounded-md bg-brand-green px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Download ownership certificate
            </a>
          ) : null}
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Sale No.">
            <span className="font-medium text-neutral-900">{sale.saleCode}</span>
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={sale.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {SALE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Property">
            <div>
              <div className="font-medium text-neutral-900">{sale.property?.name || "—"}</div>
              {sale.property?.code ? (
                <div className="text-xs text-neutral-500">{sale.property.code}</div>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow label="Client">
            <div>
              <div className="font-medium text-neutral-900">
                {sale.client?.companyName || sale.client?.contactName || "—"}
              </div>
              {sale.client?.email ? (
                <div className="text-xs text-neutral-500">{sale.client.email}</div>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow label="Price">
            <span className="font-medium text-neutral-900">{formatMoney(sale.price)}</span>
          </DetailRow>
          <DetailRow label="Deposit">{formatMoney(sale.depositAmount)}</DetailRow>
          <DetailRow label="Balance">
            <span className="font-medium text-neutral-900">{formatMoney(sale.balanceAmount)}</span>
          </DetailRow>
          <DetailRow label="Sale date">{formatDate(sale.saleDate)}</DetailRow>
          <DetailRow label="Closed at">{sale.closedAt ? formatDate(sale.closedAt) : "—"}</DetailRow>
        </dl>
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
        Delete sale
      </button>
    </div>
  );
}
