"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { LETTERHEAD } from "@/config/documents";
import { formatMoney, type Client, type Project, type Quotation } from "@/lib/admin/types";
import { LineItemEditor, type LineItemDraft } from "./LineItemEditor";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function defaultValidUntil(): string {
  const d = new Date(Date.now() + LETTERHEAD.quoteValidDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function QuotationForm({
  initial = null,
  quotationId = null,
}: {
  initial?: Quotation | null;
  quotationId?: string | null;
}) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [validUntil, setValidUntil] = useState(
    initial?.validUntil ? initial.validUntil.slice(0, 10) : defaultValidUntil(),
  );
  const [taxRate, setTaxRate] = useState(() => {
    if (initial && Number(initial.subtotal) > 0) {
      return ((Number(initial.tax) / Number(initial.subtotal)) * 100).toFixed(2);
    }
    return String(LETTERHEAD.vatRate);
  });
  const [discount, setDiscount] = useState(initial ? String(Number(initial.discount)) : "0");
  const [items, setItems] = useState<LineItemDraft[]>(
    initial?.items?.length
      ? initial.items.map((it) => ({
          description: it.description,
          quantity: String(Number(it.quantity)),
          unitPrice: String(Number(it.unitPrice)),
        }))
      : [{ description: "", quantity: "1", unitPrice: "" }],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/projects?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([cr, pr]) => {
        const cj = (await cr.json().catch(() => null)) as { data?: Client[] } | null;
        const pj = (await pr.json().catch(() => null)) as { data?: Project[] } | null;
        if (!cancelled) {
          setClients(cj?.data ?? []);
          setProjects(pj?.data ?? []);
        }
      })
      .catch(() => {
        // Options lists are convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0,
    );
    const tax = (subtotal * (Number(taxRate) || 0)) / 100;
    const discountN = Number(discount) || 0;
    return { subtotal, tax, discount: discountN, total: subtotal + tax - discountN };
  }, [items, taxRate, discount]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanItems = items
      .filter((it) => it.description.trim())
      .map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
      }));

    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!clientId) {
      setError("Select a client to quote.");
      return;
    }
    if (cleanItems.length === 0) {
      setError("Add at least one line item with a description.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        quotationId ? `/api/admin/quotations/${quotationId}` : "/api/admin/quotations",
        {
          method: quotationId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            clientId,
            projectId: projectId || undefined,
            validUntil: validUntil ? new Date(`${validUntil}T00:00:00`).toISOString() : undefined,
            taxRate: Number(taxRate) || 0,
            discount: Number(discount) || 0,
            items: cleanItems,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save quotation.");
      const id = body?.id ?? quotationId;
      if (id) {
        router.push(`/admin/documents/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save quotation.");
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
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="quotation-title">
            Title
          </label>
          <input
            id="quotation-title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Construction of 3-bedroom house – Kumasi"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="quotation-client">
            Client *
          </label>
          <select
            id="quotation-client"
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
          <label className={labelClass} htmlFor="quotation-project">
            Project (optional)
          </label>
          <select
            id="quotation-project"
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="quotation-valid">
            Valid until
          </label>
          <input
            id="quotation-valid"
            type="date"
            className={inputClass}
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="quotation-tax">
              VAT rate (%)
            </label>
            <input
              id="quotation-tax"
              type="number"
              min="0"
              max="100"
              step="0.01"
              className={inputClass}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="quotation-discount">
              Discount (GHS)
            </label>
            <input
              id="quotation-discount"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-neutral-700">Line items</div>
        <LineItemEditor items={items} onChange={setItems} />
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span className="font-medium text-neutral-900">{formatMoney(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">VAT ({Number(taxRate) || 0}%)</span>
          <span className="font-medium text-neutral-900">{formatMoney(totals.tax)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between">
            <span className="text-neutral-500">Discount</span>
            <span className="font-medium text-neutral-900">- {formatMoney(totals.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-brand-blue">
          <span>Total</span>
          <span>{formatMoney(totals.total)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {quotationId ? "Save changes" : "Create quotation"}
        </Button>
        <a
          href={quotationId ? `/admin/documents/${quotationId}` : "/admin/documents"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
