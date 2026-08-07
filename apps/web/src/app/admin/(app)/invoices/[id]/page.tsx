"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, label, type Invoice, type InvoiceItem } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

function clientName(c: Invoice["client"]): string {
  if (!c) return "—";
  return c.companyName || c.contactName || c.clientCode || "—";
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnitPrice, setItemUnitPrice] = useState("");

  const load = useCallback(() => {
    let cancelled = false;
    fetch(`/api/admin/invoices/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Invoice & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this invoice.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setInvoice(record);
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

  useEffect(() => {
    load();
  }, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    if (!itemDesc.trim()) {
      setMessage("A description is required.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: itemDesc.trim(),
          quantity: Number(itemQty) || 0,
          unitPrice: Number(itemUnitPrice) || 0,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not add the item.");
      setItemDesc("");
      setItemQty("1");
      setItemUnitPrice("");
      setMessage("Item added.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add the item.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: InvoiceItem) {
    if (!invoice) return;
    if (!window.confirm(`Remove "${item.description}" from this invoice?`)) return;
    setMessage("");
    const res = await fetch(`/api/admin/invoices/${invoice.id}/items/${item.id}`, { method: "DELETE" });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) {
      setMessage(body?.message ?? "Could not remove the item.");
      return;
    }
    setMessage("Item removed.");
    load();
  }

  async function remove() {
    if (!invoice) return;
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/invoices/${invoice.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete invoice.");
      return;
    }
    router.push("/admin/invoices");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link href="/admin/invoices" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to invoices
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Invoice not found."}
        </p>
      </div>
    );
  }

  const items = invoice.items ?? [];
  const itemsEditable = invoice.status === "DRAFT" || invoice.status === "SENT";

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/invoices" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to invoices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{invoice.invoiceNo}</h1>
          <StatusBadge value={invoice.status} />
        </div>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Client">{clientName(invoice.client)}</DetailRow>
          <DetailRow label="Project">
            {invoice.project ? (
              <Link href={`/admin/projects/${invoice.project.id}`} className="font-semibold text-brand-blue hover:underline">
                {invoice.project.name} ({invoice.project.code})
              </Link>
            ) : (
              "—"
            )}
          </DetailRow>
          <DetailRow label="Issued on">{formatDate(invoice.issuedOn)}</DetailRow>
          <DetailRow label="Due on">{formatDate(invoice.dueOn)}</DetailRow>
          <DetailRow label="Paid on">{invoice.paidOn ? formatDate(invoice.paidOn) : "—"}</DetailRow>
          <DetailRow label="Subtotal">{formatMoney(invoice.subtotal)}</DetailRow>
          {Number(invoice.tax) > 0 && <DetailRow label="Tax">{formatMoney(invoice.tax)}</DetailRow>}
          {Number(invoice.discount) > 0 && <DetailRow label="Discount">- {formatMoney(invoice.discount)}</DetailRow>}
          <DetailRow label="Total">{formatMoney(invoice.total)}</DetailRow>
          {invoice.notes && <DetailRow label="Notes">{invoice.notes}</DetailRow>}
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Line items</h2>
          {!itemsEditable && (
            <span className="text-xs text-neutral-500">
              Item editing is available for {label("DRAFT")} / {label("SENT")} invoices only.
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 px-3 py-6 text-center text-sm text-neutral-500">
            No line items on this invoice yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Unit price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount</th>
                  {itemsEditable && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-3 text-sm text-neutral-800">{it.description}</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-800">{it.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-neutral-800">{formatMoney(it.unitPrice)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-neutral-900">{formatMoney(it.amount)}</td>
                    {itemsEditable && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(it)}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {itemsEditable && (
          <form onSubmit={addItem} className="mt-4 grid grid-cols-[1fr_72px_110px_auto] items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Description</label>
              <input
                className={inputClass}
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Works or materials"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Qty</label>
              <input
                className={`${inputClass} text-right`}
                value={itemQty}
                inputMode="decimal"
                onChange={(e) => setItemQty(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">Unit price (GHS)</label>
              <input
                className={`${inputClass} text-right`}
                value={itemUnitPrice}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(e) => setItemUnitPrice(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" loading={busy}>Add item</Button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit details</h2>
        <InvoiceForm initial={invoice} />
      </div>
    </div>
  );
}