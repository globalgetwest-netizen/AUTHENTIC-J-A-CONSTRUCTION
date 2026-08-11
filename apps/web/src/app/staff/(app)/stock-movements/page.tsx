"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { Field, inputClass, useCatalog } from "@/lib/staff/ui";
import { formatDateTime, type Material, type StockMovement, type Warehouse } from "@/lib/admin/types";

/** Transfer stock between warehouses — the stores team moves material between sites. */
function CreateTransfer({ onCreated }: { onCreated: () => void }) {
  const materials = useCatalog<Material>("/api/staff/materials?pageSize=100");
  const warehouses = useCatalog<Warehouse>("/api/staff/warehouses?pageSize=100");
  const [materialId, setMaterialId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return setError("A material is required.");
    if (!fromWarehouseId) return setError("A source warehouse is required.");
    if (!toWarehouseId) return setError("A destination warehouse is required.");
    if (fromWarehouseId === toWarehouseId) return setError("Source and destination must differ.");
    if (!quantity || Number(quantity) <= 0) return setError("A valid quantity is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/stock-movements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          materialId,
          fromWarehouseId,
          toWarehouseId,
          quantity: Number(quantity),
          notes: notes.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not transfer stock.");
      setMaterialId("");
      setFromWarehouseId("");
      setToWarehouseId("");
      setQuantity("");
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not transfer stock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Transfer stock between warehouses</h2>
        <p className="text-xs text-neutral-500">
          Move material from one warehouse to another (e.g. main store to a site store).
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Material *">
          <select className={inputClass} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">Select material…</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity *">
          <input
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="From warehouse *">
          <select className={inputClass} value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}>
            <option value="">Select source…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </Field>
        <Field label="To warehouse *">
          <select className={inputClass} value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)}>
            <option value="">Select destination…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </Field>
        <Field label="Notes" span>
          <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional note" />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Transfer stock</Button>
      </div>
    </form>
  );
}

export default function StaffStockMovementsPage() {
  return (
    <WorkArea<StockMovement>
      title="Stock movements"
      subtitle="Transfers of material between warehouses, carried out by the stores team."
      api="/api/staff/stock-movements"
      searchPlaceholder="Search notes…"
      empty="No transfers yet. Move your first stock between warehouses above."
      form={(onCreated) => <CreateTransfer onCreated={onCreated} />}
      columns={[
        { key: "movedAt", header: "Moved on", render: (m) => formatDateTime(m.movedAt) },
        {
          key: "inventoryId",
          header: "Material",
          render: (m) => (
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">{m.inventory?.material?.name ?? "—"}</div>
              <div className="text-[11px] text-neutral-400">{m.inventory?.material?.sku}</div>
            </div>
          ),
        },
        {
          key: "fromWarehouseId",
          header: "From → To",
          render: (m) => (
            <span className="text-sm text-neutral-700">
              {m.fromWarehouse?.name ?? "—"} <span className="text-neutral-400">→</span> {m.toWarehouse?.name ?? "—"}
            </span>
          ),
        },
        {
          key: "quantity",
          header: "Quantity",
          render: (m) => `${String(m.quantity)} ${m.inventory?.material?.unit ?? ""}`.trim(),
        },
        { key: "notes", header: "Notes", render: (m) => m.notes ?? "—" },
      ]}
    />
  );
}
