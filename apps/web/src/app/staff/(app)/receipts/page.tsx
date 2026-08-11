"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Field, inputClass, useCatalog } from "@/lib/staff/ui";
import {
  PAYMENT_METHODS,
  formatDate,
  formatMoney,
  type Client,
  type Invoice,
  type Receipt,
} from "@/lib/admin/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Record a payment received from a client — attributed to the cashier on duty. */
function CreateReceipt({ onCreated }: { onCreated: () => void }) {
  const clients = useCatalog<Client>("/api/staff/clients?pageSize=100");
  const invoices = useCatalog<Invoice>("/api/staff/invoices?pageSize=100&status=SENT");
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [receivedOn, setReceivedOn] = useState(today());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return setError("A client is required.");
    if (!amount || Number(amount) <= 0) return setError("A valid amount is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/receipts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId,
          invoiceId: invoiceId || null,
          amount: Number(amount),
          method,
          receivedOn: receivedOn || null,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save receipt.");
      setClientId("");
      setInvoiceId("");
      setAmount("");
      setReference("");
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save receipt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Record a payment received</h2>
        <p className="text-xs text-neutral-500">
          Cash, transfer or mobile-money received from a client. You are recorded as the cashier.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client *">
          <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName || c.contactName} ({c.clientCode})</option>
            ))}
          </select>
        </Field>
        <Field label="Invoice (optional)">
          <select className={inputClass} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">No invoice</option>
            {invoices.map((i) => (
              <option key={i.id} value={i.id}>{i.invoiceNo} — {formatMoney(i.total)}</option>
            ))}
          </select>
        </Field>
        <Field label="Amount (GHS) *">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Method">
          <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Received on">
          <input type="date" className={inputClass} value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} />
        </Field>
        <Field label="Reference">
          <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Mobile money ref" />
        </Field>
        <Field label="Notes" span>
          <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional note" />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Record receipt</Button>
      </div>
    </form>
  );
}

export default function StaffReceiptsPage() {
  return (
    <WorkArea<Receipt>
      title="Receipts"
      subtitle="Payments received from clients, recorded by the Finance cashier on duty."
      api="/api/staff/receipts"
      searchPlaceholder="Search receipt or reference…"
      empty="No receipts yet. Record the first client payment above."
      form={(onCreated) => <CreateReceipt onCreated={onCreated} />}
      columns={[
        { key: "receiptNo", header: "Receipt", render: (r) => <span className="font-medium text-neutral-700">{r.receiptNo}</span> },
        { key: "clientId", header: "Client", render: (r) => r.client?.companyName || r.client?.contactName || "—" },
        { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount) },
        { key: "method", header: "Method", render: (r) => <StatusBadge value={r.method} /> },
        { key: "receivedOn", header: "Received on", render: (r) => formatDate(r.receivedOn) },
        { key: "receivedBy", header: "Cashier", render: (r) => (r.receivedBy ? `${r.receivedBy.firstName} ${r.receivedBy.lastName}` : "—") },
      ]}
    />
  );
}
