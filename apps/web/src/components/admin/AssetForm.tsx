"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { ASSET_STATUSES, type Asset } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function AssetForm({ initial = null }: { initial?: Asset | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "GENERAL");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ? initial.purchaseDate.slice(0, 10) : "");
  const [purchasePrice, setPurchasePrice] = useState(
    initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
  );
  const [currentValue, setCurrentValue] = useState(
    initial?.currentValue != null ? String(initial.currentValue) : "",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("A name is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/assets/${initial.id}` : "/api/admin/assets",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            category: category.trim() || "GENERAL",
            status,
            purchaseDate: purchaseDate || null,
            ...(purchasePrice !== "" ? { purchasePrice: Number(purchasePrice) } : {}),
            ...(currentValue !== "" ? { currentValue: Number(currentValue) } : {}),
            location: location.trim() || null,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save asset.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/assets/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save asset.");
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
          <label className={labelClass} htmlFor="as-name">Name *</label>
          <input id="as-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Office laptops (25 units)" />
        </div>
        <div>
          <label className={labelClass} htmlFor="as-category">Category</label>
          <input id="as-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="GENERAL" />
        </div>
        <div>
          <label className={labelClass} htmlFor="as-status">Status</label>
          <select id="as-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="as-date">Purchase date</label>
          <input id="as-date" type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="as-price">Purchase price (GHS)</label>
          <input id="as-price" type="number" min="0" step="0.01" className={inputClass} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="as-value">Current value (GHS)</label>
          <input id="as-value" type="number" min="0" step="0.01" className={inputClass} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="as-location">Location</label>
          <input id="as-location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Site / office / store" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="as-notes">Notes</label>
          <textarea id="as-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add asset"}</Button>
        <a
          href={initial ? `/admin/assets/${initial.id}` : "/admin/assets"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}