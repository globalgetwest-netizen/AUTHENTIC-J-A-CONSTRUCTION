"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatMoney,
  label,
  PROPERTY_STATUSES,
  type Property,
} from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/properties/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Property & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this property.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setProperty(record);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!property || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setProperty({ ...property, status: next as Property["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!property) return;
    if (!window.confirm("Delete this property? This cannot be undone.")) return;
    await fetch(`/api/admin/properties/${property.id}`, { method: "DELETE" });
    router.push("/admin/properties");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !property) {
    return (
      <div>
        <Link href="/admin/properties" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to properties
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Property not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit {property.name}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <PropertyForm initial={property} propertyId={property.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/properties" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to properties
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{property.name}</h1>
          <StatusBadge value={property.status} />
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Code">
            <span className="font-medium text-neutral-900">{property.code}</span>
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={property.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {PROPERTY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Type">{property.propertyType?.name || "—"}</DetailRow>
          <DetailRow label="Address">{property.address || "—"}</DetailRow>
          <DetailRow label="Location">{property.location || "—"}</DetailRow>
          <DetailRow label="Price">
            <span className="font-medium text-neutral-900">{formatMoney(property.price)}</span>
          </DetailRow>
          <DetailRow label="Area (sqm)">
            {property.areaSqm != null ? String(property.areaSqm) : "—"}
          </DetailRow>
          <DetailRow label="Bedrooms">{property.bedrooms ?? "—"}</DetailRow>
          <DetailRow label="Bathrooms">{property.bathrooms ?? "—"}</DetailRow>
          <DetailRow label="Featured">{property.featured ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Description">{property.description || "—"}</DetailRow>
        </dl>
      </div>

      {message && (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={remove}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Delete property
      </button>
    </div>
  );
}
