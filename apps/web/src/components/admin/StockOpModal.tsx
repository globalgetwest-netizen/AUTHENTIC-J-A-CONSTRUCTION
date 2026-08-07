"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { Icon } from "../icons";
import type { Material, Warehouse } from "@/lib/admin/types";

export type StockOpMode = "receive" | "issue" | "adjust" | "transfer";

const MODE_LABEL: Record<StockOpMode, string> = {
  receive: "Receive stock",
  issue: "Issue stock",
  adjust: "Adjust stock",
  transfer: "Transfer stock",
};

const MODE_HINT: Record<StockOpMode, string> = {
  receive: "Add stock to a warehouse.",
  issue: "Remove stock from a warehouse.",
  adjust: "Set the counted stock to a value (physical count).",
  transfer: "Move stock between warehouses.",
};

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function StockOpModal({
  mode,
  onClose,
  onDone,
  materials,
  warehouses,
  defaults = null,
}: {
  mode: StockOpMode;
  onClose: () => void;
  onDone: () => void;
  materials: Material[];
  warehouses: Warehouse[];
  defaults?: { materialId?: string; warehouseId?: string } | null;
}) {
  // The parent remounts this modal on every open (changing `key`), so the
  // initial state is a fresh snapshot of the defaults for this operation.
  const [materialId, setMaterialId] = useState(defaults?.materialId ?? "");
  const [warehouseId, setWarehouseId] = useState(defaults?.warehouseId ?? "");
  const [fromWarehouseId, setFromWarehouseId] = useState(defaults?.warehouseId ?? "");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isTransfer = mode === "transfer";
  const endpoint =
    mode === "receive"
      ? "/api/admin/inventory/receipts"
      : mode === "issue"
        ? "/api/admin/inventory/issuances"
        : mode === "adjust"
          ? "/api/admin/inventory/adjustments"
          : "/api/admin/inventory/transfers";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return setError("Choose a material.");
    if (isTransfer) {
      if (!fromWarehouseId || !toWarehouseId)
        return setError("Choose source and destination warehouses.");
      if (fromWarehouseId === toWarehouseId)
        return setError("Source and destination must be different.");
    } else if (!warehouseId) {
      return setError("Choose a warehouse.");
    }
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty <= 0)
      return setError("Enter a quantity greater than zero.");
    setBusy(true);
    setError("");
    try {
      const body = isTransfer
        ? {
            materialId,
            fromWarehouseId,
            toWarehouseId,
            quantity: qty,
            notes: notes.trim() || null,
          }
        : {
            materialId,
            warehouseId,
            quantity: qty,
            ...(mode === "receive" && unitCost !== "" ? { unitCost: Number(unitCost) } : {}),
            notes: notes.trim() || null,
          };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const resBody = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(resBody?.message ?? "Could not complete stock operation.");
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete stock operation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ajac-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{MODE_LABEL[mode]}</h2>
            <p className="mt-1 text-sm text-neutral-500">{MODE_HINT[mode]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-4">
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              {error}
            </p>
          )}

          <div>
            <label className={labelClass} htmlFor="so-material">
              Material *
            </label>
            <select
              id="so-material"
              className={inputClass}
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              <option value="">Select a material…</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.sku})
                </option>
              ))}
            </select>
          </div>

          {isTransfer ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="so-from">
                  From warehouse *
                </label>
                <select
                  id="so-from"
                  className={inputClass}
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="so-to">
                  To warehouse *
                </label>
                <select
                  id="so-to"
                  className={inputClass}
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass} htmlFor="so-warehouse">
                Warehouse *
              </label>
              <select
                id="so-warehouse"
                className={inputClass}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select a warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="so-qty">
                Quantity *
              </label>
              <input
                id="so-qty"
                type="number"
                min={mode === "adjust" ? "0" : "0.001"}
                step="0.001"
                className={inputClass}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={mode === "adjust" ? "Counted quantity" : "0"}
              />
            </div>
            {mode === "receive" && (
              <div>
                <label className={labelClass} htmlFor="so-cost">
                  Unit cost (GHS)
                </label>
                <input
                  id="so-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="so-notes">
              Notes
            </label>
            <textarea
              id="so-notes"
              rows={2}
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery note, project reference…"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              {MODE_LABEL[mode]}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
