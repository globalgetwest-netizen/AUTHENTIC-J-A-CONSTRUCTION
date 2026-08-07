"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { LineItemEditor, type LineItemDraft } from "./LineItemEditor";
import {
  formatMoney,
  INVOICE_STATUSES,
  type Client,
  type Invoice,
  type Project,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";
const CURRENCIES = ["GHS", "USD"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InvoiceForm({ initial = null }: { initial?: Invoice | null }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [issuedOn, setIssuedOn] = useState(initial?.issuedOn ? initial.issuedOn.slice(0, 10) : today());
  const [dueOn, setDueOn] = useState(initial?.dueOn ? initial.dueOn.slice(0, 10) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? "GHS");
  const [tax, setTax] = useState(initial?.tax != null ? String(Number(initial.tax)) : "");
  const [discount, setDiscount] = useState(initial?.discount != null ? String(Number(initial.discount)) : "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<LineItemDraft[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }).then((r) =>
        r.json().catch(() => null),
      ),
      fetch("/api/admin/projects?pageSize=100", { cache: "no-store" }).then((r) =>
        r.json().catch(() => null),
      ),
    ])
      .then(([clientsBody, projectsBody]) => {
        if (cancelled) return;
        const c = (clientsBody as { data?: Client[] } | null)?.data;
        const p = (projectsBody as { data?: Project[] } | null)?.data;
        setClients(Array.isArray(c) ? c : []);
        setProjects(Array.isArray(p) ? p : []);
      })
      .catch(() => {
        // Options lists are a convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0,
      ),
    [items],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setError("Select a client for the invoice.");
      return;
    }
    if (!dueOn) {
      setError("A due date is required.");
      return;
    }
    if (!isEdit) {
      const cleanItems = items
        .filter((it) => it.description.trim())
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        }));
      if (cleanItems.length === 0) {
        setError("Add at least one line item with a description.");
        return;
      }
    }

    setBusy(true);
    setError("");
    try {
      const url = initial ? `/api/admin/invoices/${initial.id}` : "/api/admin/invoices";
      const body: Record<string, unknown> = {
        clientId,
        projectId: projectId || undefined,
        issuedOn: issuedOn ? new Date(`${issuedOn}T00:00:00`).toISOString() : undefined,
        dueOn: new Date(`${dueOn}T00:00:00`).toISOString(),
        currency,
        status,
        notes: notes.trim() || undefined,
      };
      if (tax !== "") body.tax = Number(tax);
      if (discount !== "") body.discount = Number(discount);
      if (!isEdit) {
        body.items = items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description.trim(),
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
          }));
      }

      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const response = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(response?.message ?? "Could not save invoice.");
      const id = response?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/invoices/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save invoice.");
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
          <label className={labelClass} htmlFor="inv-client">
            Client *
          </label>
          <select
            id="inv-client"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.contactName || c.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-project">
            Project (optional)
          </label>
          <select
            id="inv-project"
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-issued">
            Issued on
          </label>
          <input
            id="inv-issued"
            type="date"
            className={inputClass}
            value={issuedOn}
            onChange={(e) => setIssuedOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-due">
            Due on *
          </label>
          <input
            id="inv-due"
            type="date"
            className={inputClass}
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-currency">
            Currency
          </label>
          <select
            id="inv-currency"
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-status">
            Status
          </label>
          <select
            id="inv-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-tax">
            Tax (GHS)
          </label>
          <input
            id="inv-tax"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="inv-discount">
            Discount (GHS)
          </label>
          <input
            id="inv-discount"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="inv-notes">
            Notes
          </label>
          <textarea
            id="inv-notes"
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {!isEdit && (
        <>
          <div>
            <div className="mb-2 text-sm font-semibold text-neutral-700">Line items</div>
            <LineItemEditor items={items} onChange={setItems} />
          </div>

          <div className="ml-auto w-full max-w-xs space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium text-neutral-900">{formatMoney(subtotal)}</span>
            </div>
            {Number(tax) > 0 ? (
              <div className="flex justify-between">
                <span className="text-neutral-500">Tax</span>
                <span className="font-medium text-neutral-900">{formatMoney(Number(tax))}</span>
              </div>
            ) : null}
            {Number(discount) > 0 ? (
              <div className="flex justify-between">
                <span className="text-neutral-500">Discount</span>
                <span className="font-medium text-neutral-900">- {formatMoney(Number(discount))}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-brand-blue">
              <span>Est. total</span>
              <span>{formatMoney(subtotal + (Number(tax) || 0) - (Number(discount) || 0))}</span>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {isEdit ? "Save changes" : "Create invoice"}
        </Button>
        <a
          href={initial ? `/admin/invoices/${initial.id}` : "/admin/invoices"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}