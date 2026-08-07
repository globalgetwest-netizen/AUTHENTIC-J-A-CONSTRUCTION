"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  PAYMENT_STATUSES,
  type BlockProduct,
  type BlockSale,
  type Client,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function BlockSaleForm({ initial = null }: { initial?: BlockSale | null }) {
  const router = useRouter();
  const [products, setProducts] = useState<BlockProduct[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(
    initial?.unitPrice != null ? String(initial.unitPrice) : "",
  );
  const [soldOn, setSoldOn] = useState(initial?.soldOn ? initial.soldOn.slice(0, 10) : "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [status, setStatus] = useState(initial?.status ?? "PENDING");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/block-products?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([prodRes, clientRes]) => {
        const [prod, client] = await Promise.all([
          prodRes.json().catch(() => null),
          clientRes.json().catch(() => null),
        ]);
        if (cancelled) return;
        if (prod?.data) setProducts(prod.data);
        if (client?.data) setClients(client.data);
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
    if (!soldOn) return setError("A sale date is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/block-sales/${initial.id}` : "/api/admin/block-sales",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            productId,
            clientId: clientId || null,
            quantity: qty,
            ...(unitPrice !== "" ? { unitPrice: Number(unitPrice) } : {}),
            soldOn,
            reference: reference.trim() || null,
            ...(initial ? { status } : {}),
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save sale.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/block-sales/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save sale.");
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
          <label className={labelClass} htmlFor="bsale-product">
            Product *
          </label>
          <select
            id="bsale-product"
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
          <label className={labelClass} htmlFor="bsale-client">
            Client
          </label>
          <select
            id="bsale-client"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Cash / walk-in sale</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.contactName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="bsale-qty">
            Quantity *
          </label>
          <input
            id="bsale-qty"
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
          <label className={labelClass} htmlFor="bsale-price">
            Unit price (GHS)
          </label>
          <input
            id="bsale-price"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Leave blank for product price"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="bsale-date">
            Sale date *
          </label>
          <input
            id="bsale-date"
            type="date"
            className={inputClass}
            value={soldOn}
            onChange={(e) => setSoldOn(e.target.value)}
          />
        </div>
        {initial && (
          <div>
            <label className={labelClass} htmlFor="bsale-status">
              Payment status
            </label>
            <select
              id="bsale-status"
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof PAYMENT_STATUSES)[number])}
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="bsale-ref">
            Reference
          </label>
          <input
            id="bsale-ref"
            className={inputClass}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Invoice / delivery note number"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Record sale"}
        </Button>
        <a
          href={initial ? `/admin/block-sales/${initial.id}` : "/admin/block-sales"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
