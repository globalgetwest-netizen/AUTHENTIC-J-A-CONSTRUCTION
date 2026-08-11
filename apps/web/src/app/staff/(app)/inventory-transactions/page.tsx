"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Field, inputClass, labelClass, useCatalog } from "@/lib/staff/ui";
import { formatDateTime, type InventoryTransaction, type Material, type Warehouse } from "@/lib/admin/types";

const OP_TYPES = [
  { value: "IN", label: "Receive (IN)" },
  { value: "OUT", label: "Issue (OUT)" },
  { value: "ADJUST", label: "Adjust (count)" },
] as const;

type OpType = (typeof OP_TYPES)[number]["value"];

/** Record a store operation: receive stock, issue to site, or adjust a counted value. */
function CreateStockOp({ onCreated }: { onCreated: () => void }) {
  const materials = useCatalog<Material>("/api/staff/materials?pageSize=100");
  const warehouses = useCatalog<Warehouse>("/api/staff/warehouses?pageSize=100");
  const [type, setType] = useState<OpType>("IN");
  const [materialId, setMaterialId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return setError("A material is required.");
    if (!warehouseId) return setError("A warehouse is required.");
    if (quantity === "" || Number(quantity) < 0) return setError("A valid quantity is required.");
    if (type === "ADJUST" && Number(quantity) === 0) {
      // 0 is a legitimate counted value for ADJUST.
    } else if (Number(quantity) <= 0) {
      return setError("Quantity must be greater than zero.");
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/inventory-transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          materialId,
          warehouseId,
          quantity: Number(quantity),
          unitCost: unitCost ? Number(unitCost) : undefined,
          notes: notes.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not record the stock operation.");
      setMaterialId("");
      setWarehouseId("");
      setQuantity("");
      setUnitCost("");
      setNotes("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the stock operation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Record a stock operation</h2>
        <p className="text-xs text-neutral-500">
          Receiving goods, issuing to site, or counting stock. Each operation is recorded against you.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Operation *">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as OpType)}>
            {OP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Warehouse *">
          <select className={inputClass} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
            <option value="">Select warehouse…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </Field>
        <Field label="Material *">
          <select className={inputClass} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">Select material…</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
            ))}
          </select>
        </Field>
        <Field label={type === "ADJUST" ? "Counted quantity *" : "Quantity *"}>
          <input
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={type === "ADJUST" ? "New counted value" : "0"}
          />
        </Field>
        {type === "IN" ? (
          <Field label="Unit cost (GHS)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        ) : null}
        <Field label="Notes" span>
          <textarea className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional note" />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Record operation</Button>
      </div>
    </form>
  );
}

export default function StaffInventoryTransactionsPage() {
  return (
    <WorkArea<InventoryTransaction>
      title="Inventory transactions"
      subtitle="The stores ledger — goods received, issued and stock adjustments, attributed to the storekeeper."
      api="/api/staff/inventory-transactions"
      searchPlaceholder="Search notes…"
      empty="No transactions yet. Record the first stock operation above."
      form={(onCreated) => <CreateStockOp onCreated={onCreated} />}
      columns={[
        { key: "createdAt", header: "Date", render: (t) => formatDateTime(t.createdAt) },
        { key: "type", header: "Type", render: (t) => <StatusBadge value={t.type} /> },
        {
          key: "materialId",
          header: "Material",
          render: (t) => (
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">{t.material?.name ?? "—"}</div>
              <div className="text-[11px] text-neutral-400">{t.material?.sku}</div>
            </div>
          ),
        },
        { key: "warehouseId", header: "Warehouse", render: (t) => t.warehouse?.name ?? "—" },
        {
          key: "quantity",
          header: "Quantity",
          render: (t) => `${String(t.quantity)} ${t.material?.unit ?? ""}`.trim(),
        },
        { key: "notes", header: "Notes", render: (t) => t.notes ?? "—" },
      ]}
    />
  );
}
