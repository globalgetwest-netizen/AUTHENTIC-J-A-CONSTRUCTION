"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentRecord,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({ initial = null }: { initial?: PaymentRecord | null }) {
  const router = useRouter();
  const [payeeType, setPayeeType] = useState(initial?.payeeType ?? "");
  const [payeeId, setPayeeId] = useState(initial?.payeeId ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [method, setMethod] = useState(initial?.method ?? PAYMENT_METHODS[0]);
  const [paidOn, setPaidOn] = useState(initial?.paidOn ? initial.paidOn.slice(0, 10) : today());
  const [status, setStatus] = useState(initial?.status ?? PAYMENT_STATUSES[0]);
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(initial?.receiptUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "" || Number(amount) <= 0) return setError("An amount greater than zero is required.");
    if (!payeeType.trim()) return setError("Payee type is required.");
    if (!payeeId.trim()) return setError("Payee ID is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/payments/${initial.id}` : "/api/admin/payments",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            payeeType: payeeType.trim(),
            payeeId: payeeId.trim(),
            amount: Number(amount),
            method,
            paidOn: paidOn ? new Date(`${paidOn}T00:00:00`).toISOString() : undefined,
            status,
            reference: reference.trim() || null,
            notes: notes.trim() || null,
            receiptUrl: receiptUrl.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save payment.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/payments/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save payment.");
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
          <label className={labelClass} htmlFor="pay-payee-type">Payee type *</label>
          <input id="pay-payee-type" className={inputClass} value={payeeType} onChange={(e) => setPayeeType(e.target.value)} placeholder="e.g. SUPPLIER, EMPLOYEE, CLIENT, CONTRACTOR" />
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-payee-id">Payee ID *</label>
          <input id="pay-payee-id" className={inputClass} value={payeeId} onChange={(e) => setPayeeId(e.target.value)} placeholder="Record ID of the payee" />
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-amount">Amount (GHS) *</label>
          <input id="pay-amount" type="number" min="0" step="0.01" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-method">Method</label>
          <select id="pay-method" className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-date">Paid on</label>
          <input id="pay-date" type="date" className={inputClass} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-status">Status</label>
          <select id="pay-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-reference">Reference</label>
          <input id="pay-reference" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank ref, cheque no…" />
        </div>
        <div>
          <label className={labelClass} htmlFor="pay-receipt">Receipt URL</label>
          <input id="pay-receipt" className={inputClass} value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="pay-notes">Notes</label>
          <textarea id="pay-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add payment"}</Button>
        <a
          href={initial ? `/admin/payments/${initial.id}` : "/admin/payments"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}