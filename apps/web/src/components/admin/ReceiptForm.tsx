"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  PAYMENT_METHODS,
  type Client,
  type Invoice,
  type PaymentMethod,
  type Receipt,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReceiptForm({ initial = null }: { initial?: Receipt | null }) {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState(initial?.invoiceId ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [receivedOn, setReceivedOn] = useState(
    initial?.receivedOn ? initial.receivedOn.slice(0, 10) : today(),
  );
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "CASH");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }).then((r) =>
        r
          .json()
          .catch(() => null)
          .then((b) => (b?.data ?? []) as Client[]),
      ),
      fetch("/api/admin/invoices?pageSize=100", { cache: "no-store" }).then((r) =>
        r
          .json()
          .catch(() => null)
          .then((b) => (b?.data ?? []) as Invoice[]),
      ),
    ])
      .then(([c, inv]) => {
        if (!cancelled) {
          setClients(c);
          setInvoices(inv);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClients([]);
          setInvoices([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function clientLabel(c: Client): string {
    return c.companyName || c.contactName;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return setError("A client is required.");
    if (!amount || Number(amount) <= 0) return setError("A valid amount is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/receipts/${initial.id}` : "/api/admin/receipts",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            invoiceId: invoiceId || null,
            clientId,
            amount: Number(amount),
            receivedOn: receivedOn || null,
            method,
            reference: reference.trim() || null,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save receipt.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/receipts/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="rec-invoice">Invoice</label>
          <select
            id="rec-invoice"
            className={inputClass}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            <option value="">No invoice</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rec-client">Client *</label>
          <select
            id="rec-client"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{clientLabel(c)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rec-amount">Amount (GHS) *</label>
          <input
            id="rec-amount"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="rec-date">Received on</label>
          <input
            id="rec-date"
            type="date"
            className={inputClass}
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="rec-method">Method</label>
          <select
            id="rec-method"
            className={inputClass}
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rec-ref">Reference</label>
          <input
            id="rec-ref"
            className={inputClass}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. MOMO ref, cheque no…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="rec-notes">Notes</label>
          <textarea
            id="rec-notes"
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add receipt"}</Button>
        <a
          href={initial ? `/admin/receipts/${initial.id}` : "/admin/receipts"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}