"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  PAYMENT_STATUSES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
  type FinancialTransaction,
  type Invoice,
  type Project,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ initial = null }: { initial?: FinancialTransaction | null }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [type, setType] = useState(initial?.type ?? TRANSACTION_TYPES[0]);
  const [direction, setDirection] = useState(initial?.direction ?? TRANSACTION_DIRECTIONS[0]);
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [account, setAccount] = useState(initial?.account ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ? initial.occurredOn.slice(0, 10) : today());
  const [status, setStatus] = useState(initial?.status ?? PAYMENT_STATUSES[0]);
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [invoiceId, setInvoiceId] = useState(initial?.invoiceId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/projects?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/invoices?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([pr, ir]) => {
        const pj = (await pr.json().catch(() => null)) as { data?: Project[] } | null;
        const ij = (await ir.json().catch(() => null)) as { data?: Invoice[] } | null;
        if (!cancelled) {
          setProjects(pj?.data ?? []);
          setInvoices(ij?.data ?? []);
        }
      })
      .catch(() => {
        // Options lists are convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount === "" || Number(amount) <= 0) return setError("An amount greater than zero is required.");
    if (!category.trim()) return setError("A category is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/financial-transactions/${initial.id}` : "/api/admin/financial-transactions",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type,
            direction,
            amount: Number(amount),
            category: category.trim(),
            account: account.trim() || null,
            reference: reference.trim() || null,
            occurredOn: occurredOn ? new Date(`${occurredOn}T00:00:00`).toISOString() : undefined,
            status,
            projectId: projectId || undefined,
            invoiceId: invoiceId || undefined,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save transaction.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/financial-transactions/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save transaction.");
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
          <label className={labelClass} htmlFor="tx-type">Type</label>
          <select id="tx-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-direction">Direction</label>
          <select id="tx-direction" className={inputClass} value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
            {TRANSACTION_DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-amount">Amount (GHS) *</label>
          <input id="tx-amount" type="number" min="0" step="0.01" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-category">Category *</label>
          <input id="tx-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Materials, Payroll" />
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-account">Account</label>
          <input id="tx-account" className={inputClass} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. Bank 11223344" />
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-reference">Reference</label>
          <input id="tx-reference" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Invoice #INV-001" />
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-date">Occurred on</label>
          <input id="tx-date" type="date" className={inputClass} value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-status">Status</label>
          <select id="tx-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-project">Project (optional)</label>
          <select id="tx-project" className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="tx-invoice">Invoice (optional)</label>
          <select id="tx-invoice" className={inputClass} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">No invoice</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNo}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="tx-notes">Notes</label>
          <textarea id="tx-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add transaction"}</Button>
        <a
          href={initial ? `/admin/financial-transactions/${initial.id}` : "/admin/financial-transactions"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}