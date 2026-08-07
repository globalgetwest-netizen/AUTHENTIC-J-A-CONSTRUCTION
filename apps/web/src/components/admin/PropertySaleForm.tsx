"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  label,
  SALE_STATUSES,
  type Client,
  type Property,
  type PropertySale,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function toDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function PropertySaleForm({
  initial = null,
  saleId = null,
}: {
  initial?: PropertySale | null;
  saleId?: string | null;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [price, setPrice] = useState(initial ? String(Number(initial.price) || 0) : "");
  const [depositAmount, setDepositAmount] = useState(
    initial ? String(Number(initial.depositAmount) || 0) : "",
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "PENDING");
  const [saleDate, setSaleDate] = useState(toDate(initial?.saleDate));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/properties?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([pr, cr]) => {
        const pj = (await pr.json().catch(() => null)) as { data?: Property[] } | null;
        const cj = (await cr.json().catch(() => null)) as { data?: Client[] } | null;
        if (!cancelled) {
          setProperties(pj?.data ?? []);
          setClients(cj?.data ?? []);
        }
      })
      .catch(() => {
        // Options lists are convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !clientId) {
      setError("Property and client are required.");
      return;
    }
    if (!price) {
      setError("A price is required.");
      return;
    }
    if (!saleDate) {
      setError("A sale date is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        saleId ? `/api/admin/property-sales/${saleId}` : "/api/admin/property-sales",
        {
          method: saleId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            propertyId,
            clientId,
            price: Number(price),
            depositAmount: depositAmount ? Number(depositAmount) : undefined,
            status,
            saleDate: new Date(`${saleDate}T00:00:00`).toISOString(),
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save sale.");
      const id = body?.id ?? saleId;
      if (id) {
        router.push(`/admin/property-sales/${id}`);
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
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="sale-prop">
            Property *
          </label>
          <select
            id="sale-prop"
            className={inputClass}
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">Select a property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="sale-client">
            Client *
          </label>
          <select
            id="sale-client"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.contactName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sale-price">
            Price (GHS) *
          </label>
          <input
            id="sale-price"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sale-deposit">
            Deposit (GHS)
          </label>
          <input
            id="sale-deposit"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sale-status">
            Status
          </label>
          <select
            id="sale-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {SALE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="sale-date">
            Sale date *
          </label>
          <input
            id="sale-date"
            type="date"
            className={inputClass}
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {saleId ? "Save changes" : "Create sale"}
        </Button>
        <a
          href={saleId ? `/admin/property-sales/${saleId}` : "/admin/property-sales"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
