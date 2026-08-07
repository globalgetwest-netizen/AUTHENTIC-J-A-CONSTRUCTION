"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { BlockProduct, BlockProduction } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

const PRODUCTION_STATUSES = ["COMPLETED", "IN_PROGRESS", "PENDING", "DELAYED", "FAILED"] as const;

export function BlockProductionForm({ initial = null }: { initial?: BlockProduction | null }) {
  const router = useRouter();
  const [products, setProducts] = useState<BlockProduct[]>([]);
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [producedOn, setProducedOn] = useState(
    initial?.producedOn ? initial.producedOn.slice(0, 10) : "",
  );
  const [status, setStatus] = useState(initial?.status ?? "COMPLETED");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/block-products?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: BlockProduct[] } | null;
        if (!cancelled && body?.data) setProducts(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return setError("Choose a product.");
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty < 1) return setError("Enter a valid quantity.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/block-productions/${initial.id}` : "/api/admin/block-productions",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: qty,
            producedOn: producedOn || undefined,
            status,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save production.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/block-productions/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save production.");
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
          <label className={labelClass} htmlFor="bprod-product">
            Product *
          </label>
          <select
            id="bprod-product"
            className={inputClass}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="bprod-qty">
            Quantity *
          </label>
          <input
            id="bprod-qty"
            type="number"
            min="1"
            step="1"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Number of blocks"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bprod-date">
            Produced on
          </label>
          <input
            id="bprod-date"
            type="date"
            className={inputClass}
            value={producedOn}
            onChange={(e) => setProducedOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bprod-status">
            Status
          </label>
          <select
            id="bprod-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {PRODUCTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="bprod-notes">
            Notes
          </label>
          <textarea
            id="bprod-notes"
            rows={3}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Curing batch, machine used, staff…"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Record production"}
        </Button>
        <a
          href={initial ? `/admin/block-productions/${initial.id}` : "/admin/block-productions"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
