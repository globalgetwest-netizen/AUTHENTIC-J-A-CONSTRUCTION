"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { Field, inputClass, useCatalog } from "@/lib/staff/ui";
import { formatMoney, type Material, type MaterialCategory } from "@/lib/admin/types";

/** Add a new material to the procurement catalogue. */
function CreateMaterial({ onCreated }: { onCreated: () => void }) {
  const categories = useCatalog<MaterialCategory>("/api/staff/material-categories?pageSize=100");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return setError("A category is required.");
    if (!name.trim()) return setError("A material name is required.");
    if (!unit.trim()) return setError("A unit of measure is required (e.g. bags, tonnes, pcs).");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/materials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId,
          name: name.trim(),
          unit: unit.trim(),
          reorderLevel: reorderLevel ? Number(reorderLevel) : undefined,
          costPerUnit: costPerUnit ? Number(costPerUnit) : undefined,
          description: description.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not create material.");
      setCategoryId("");
      setName("");
      setUnit("");
      setReorderLevel("");
      setCostPerUnit("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create material.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Add a material to the catalogue</h2>
        <p className="text-xs text-neutral-500">
          New materials are added by the procurement department for use across stores and projects.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category *">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </Field>
        <Field label="Unit of measure *">
          <input
            className={inputClass}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. bags, tonnes, pcs, litres"
          />
        </Field>
        <Field label="Name *">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Portland cement (bag)"
          />
        </Field>
        <Field label="Reorder level">
          <input
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Cost per unit (GHS)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Description" span>
          <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional detail" />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Add material</Button>
      </div>
    </form>
  );
}

export default function StaffMaterialsPage() {
  return (
    <WorkArea<Material>
      title="Materials"
      subtitle="The materials catalogue — what the company buys and stores, maintained by procurement."
      api="/api/staff/materials"
      searchPlaceholder="Search name or SKU…"
      empty="No materials yet. Add the first material to the catalogue above."
      form={(onCreated) => <CreateMaterial onCreated={onCreated} />}
      columns={[
        {
          key: "name",
          header: "Material",
          render: (m) => (
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">{m.name}</div>
              <div className="text-[11px] text-neutral-400">{m.sku}</div>
            </div>
          ),
        },
        { key: "categoryId", header: "Category", render: (m) => m.category?.name ?? "—" },
        { key: "unit", header: "Unit", render: (m) => m.unit },
        {
          key: "currentStock",
          header: "Stock",
          render: (m) => (
            <span className="font-semibold text-neutral-900">{String(m.currentStock ?? "0")}</span>
          ),
        },
        {
          key: "costPerUnit",
          header: "Cost / unit",
          render: (m) => (m.costPerUnit != null ? formatMoney(m.costPerUnit) : "—"),
        },
      ]}
    />
  );
}
