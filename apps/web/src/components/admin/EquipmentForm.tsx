"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { EQUIPMENT_STATUSES, type Equipment } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function EquipmentForm({ initial = null }: { initial?: Equipment | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [serialNo, setSerialNo] = useState(initial?.serialNo ?? "");
  const [category, setCategory] = useState(initial?.category ?? "GENERAL");
  const [status, setStatus] = useState(initial?.status ?? "AVAILABLE");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ? initial.purchaseDate.slice(0, 10) : "");
  const [purchasePrice, setPurchasePrice] = useState(
    initial?.purchasePrice != null ? String(initial.purchasePrice) : "",
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
        initial ? `/api/admin/equipment/${initial.id}` : "/api/admin/equipment",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            model: model.trim() || null,
            serialNo: serialNo.trim() || null,
            category,
            status,
            purchaseDate: purchaseDate || null,
            ...(purchasePrice !== "" ? { purchasePrice: Number(purchasePrice) } : {}),
            location: location.trim() || null,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save equipment.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/equipment/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save equipment.");
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
          <label className={labelClass} htmlFor="eq-name">Name *</label>
          <input id="eq-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Excavator 30t" />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-model">Model</label>
          <input id="eq-model" className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Make / model" />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-serial">Serial number</label>
          <input id="eq-serial" className={inputClass} value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-category">Category</label>
          <input id="eq-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="GENERAL" />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-status">Status</label>
          <select id="eq-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-date">Purchase date</label>
          <input id="eq-date" type="date" className={inputClass} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-price">Purchase price (GHS)</label>
          <input id="eq-price" type="number" min="0" step="0.01" className={inputClass} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="eq-location">Location</label>
          <input id="eq-location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Site / yard" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="eq-notes">Notes</label>
          <textarea id="eq-notes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add equipment"}</Button>
        <a
          href={initial ? `/admin/equipment/${initial.id}` : "/admin/equipment"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}