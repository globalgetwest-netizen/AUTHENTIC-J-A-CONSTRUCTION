"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { BlockProduct } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function BlockProductForm({ initial = null }: { initial?: BlockProduct | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [unitPrice, setUnitPrice] = useState(
    initial?.unitPrice != null ? String(initial.unitPrice) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("A name is required.");
    const price = Number(unitPrice);
    if (unitPrice === "" || Number.isNaN(price) || price < 0)
      return setError("Enter a valid unit price.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/block-products/${initial.id}` : "/api/admin/block-products",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            unitPrice: price,
            description: description.trim() || null,
            isActive,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save product.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/block-products/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
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
          <label className={labelClass} htmlFor="bp-name">
            Name *
          </label>
          <input
            id="bp-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="6-inch solid block"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bp-price">
            Unit price (GHS) *
          </label>
          <input
            id="bp-price"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bp-active">
            Status
          </label>
          <select
            id="bp-active"
            className={inputClass}
            value={isActive ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="bp-desc">
            Description
          </label>
          <textarea
            id="bp-desc"
            rows={3}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Create product"}
        </Button>
        <a
          href={initial ? `/admin/block-products/${initial.id}` : "/admin/block-products"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
