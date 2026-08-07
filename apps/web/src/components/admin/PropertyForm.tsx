"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  PROPERTY_STATUSES,
  label,
  type Property,
  type PropertyType,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function PropertyForm({
  initial = null,
  propertyId = null,
}: {
  initial?: Property | null;
  propertyId?: string | null;
}) {
  const router = useRouter();
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [typeId, setTypeId] = useState(initial?.typeId ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "AVAILABLE");
  const [price, setPrice] = useState(initial ? String(Number(initial.price) || 0) : "");
  const [areaSqm, setAreaSqm] = useState(initial ? String(Number(initial.areaSqm) || 0) : "");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms != null ? String(initial.bedrooms) : "");
  const [bathrooms, setBathrooms] = useState(
    initial?.bathrooms != null ? String(initial.bathrooms) : "",
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/property-types?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: PropertyType[] } | null;
        if (!cancelled) setTypes(body?.data ?? []);
      })
      .catch(() => {
        // Options list is convenience; the form still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("A name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        propertyId ? `/api/admin/properties/${propertyId}` : "/api/admin/properties",
        {
          method: propertyId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            typeId: typeId || null,
            status,
            price: price ? Number(price) : null,
            areaSqm: areaSqm ? Number(areaSqm) : null,
            bedrooms: bedrooms ? Number(bedrooms) : null,
            bathrooms: bathrooms ? Number(bathrooms) : null,
            address: address.trim() || null,
            location: location.trim() || null,
            description: description.trim() || null,
            featured,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save property.");
      const id = body?.id ?? propertyId;
      if (id) {
        router.push(`/admin/properties/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save property.");
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
          <label className={labelClass} htmlFor="prop-name">
            Name *
          </label>
          <input
            id="prop-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plots at Ahodwo"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-type">
            Property type
          </label>
          <select
            id="prop-type"
            className={inputClass}
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">None yet — manage in Property types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-status">
            Status
          </label>
          <select
            id="prop-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-price">
            Price (GHS)
          </label>
          <input
            id="prop-price"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-area">
            Area (sqm)
          </label>
          <input
            id="prop-area"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-bed">
            Bedrooms
          </label>
          <input
            id="prop-bed"
            type="number"
            min="0"
            className={inputClass}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-bath">
            Bathrooms
          </label>
          <input
            id="prop-bath"
            type="number"
            min="0"
            className={inputClass}
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-address">
            Address
          </label>
          <input
            id="prop-address"
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="prop-location">
            Location
          </label>
          <input
            id="prop-location"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="prop-desc">
            Description
          </label>
          <textarea
            id="prop-desc"
            rows={3}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured on the public site
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {propertyId ? "Save changes" : "Create property"}
        </Button>
        <a
          href={propertyId ? `/admin/properties/${propertyId}` : "/admin/properties"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
