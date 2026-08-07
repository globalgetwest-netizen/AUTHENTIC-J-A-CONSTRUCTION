"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { Material, MaterialCategory } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function MaterialForm({ initial = null }: { initial?: Material | null }) {
  const router = useRouter();
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [reorderLevel, setReorderLevel] = useState(
    initial?.reorderLevel != null ? String(initial.reorderLevel) : "",
  );
  const [costPerUnit, setCostPerUnit] = useState(
    initial?.costPerUnit != null ? String(initial.costPerUnit) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/material-categories?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: MaterialCategory[] } | null;
        if (!cancelled && body?.data) setCategories(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("A name is required.");
    if (!categoryId) return setError("A category is required.");
    if (!unit.trim()) return setError("A unit is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/materials/${initial.id}` : "/api/admin/materials",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            categoryId,
            unit: unit.trim(),
            reorderLevel: reorderLevel !== "" ? Number(reorderLevel) : initial ? null : undefined,
            costPerUnit: costPerUnit !== "" ? Number(costPerUnit) : initial ? null : undefined,
            description: description.trim() || null,
            isActive,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save material.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/materials/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save material.");
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
          <label className={labelClass} htmlFor="mat-name">
            Name *
          </label>
          <input
            id="mat-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cement (Ghacem 42.5R)"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mat-category">
            Category *
          </label>
          <select
            id="mat-category"
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="mat-unit">
            Unit *
          </label>
          <input
            id="mat-unit"
            className={inputClass}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="bag, tonne, m³…"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mat-reorder">
            Reorder level
          </label>
          <input
            id="mat-reorder"
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mat-cost">
            Cost per unit (GHS)
          </label>
          <input
            id="mat-cost"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mat-active">
            Status
          </label>
          <select
            id="mat-active"
            className={inputClass}
            value={isActive ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="mat-desc">
            Description
          </label>
          <textarea
            id="mat-desc"
            rows={3}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Create material"}
        </Button>
        <a
          href={initial ? `/admin/materials/${initial.id}` : "/admin/materials"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
