"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Field, inputClass, useCatalog } from "@/lib/staff/ui";
import { formatDate, type BlockProduct, type BlockProduction } from "@/lib/admin/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Record a production run at the block factory. */
function CreateProduction({ onCreated }: { onCreated: () => void }) {
  const products = useCatalog<BlockProduct>("/api/staff/block-products?pageSize=100");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [producedOn, setProducedOn] = useState(today());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return setError("Select a block product.");
    if (!quantity || Number(quantity) <= 0) return setError("A valid quantity is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/block-productions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: Number(quantity),
          producedOn: producedOn || null,
          notes: notes.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not record production.");
      setProductId("");
      setQuantity("");
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record production.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Record a production run</h2>
        <p className="text-xs text-neutral-500">
          Log blocks produced at the factory. Each run is attributed to the supervisor on shift.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product *">
          <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity produced *">
          <input
            type="number"
            min="1"
            step="1"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Produced on">
          <input type="date" className={inputClass} value={producedOn} onChange={(e) => setProducedOn(e.target.value)} />
        </Field>
        <Field label="Notes" span>
          <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional note — curing, machine, crew…" />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Record production</Button>
      </div>
    </form>
  );
}

export default function StaffBlockProductionsPage() {
  return (
    <WorkArea<BlockProduction>
      title="Block production"
      subtitle="Production runs at the block factory, logged by the production supervisor."
      api="/api/staff/block-productions"
      searchPlaceholder="Search batch or notes…"
      empty="No production runs yet. Record the first batch above."
      form={(onCreated) => <CreateProduction onCreated={onCreated} />}
      columns={[
        { key: "batchNo", header: "Batch", render: (b) => <span className="font-medium text-neutral-700">{b.batchNo}</span> },
        { key: "productId", header: "Product", render: (b) => b.product?.name ?? "—" },
        {
          key: "quantity",
          header: "Quantity",
          render: (b) => <span className="font-semibold text-neutral-900">{String(b.quantity)}</span>,
        },
        { key: "producedOn", header: "Produced on", render: (b) => formatDate(b.producedOn) },
        { key: "status", header: "Status", render: (b) => <StatusBadge value={b.status} /> },
        { key: "notes", header: "Notes", render: (b) => b.notes ?? "—" },
      ]}
    />
  );
}
