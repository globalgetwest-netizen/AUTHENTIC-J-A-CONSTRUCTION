"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { EquipmentForm } from "@/components/admin/EquipmentForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, type Equipment } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/equipment/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Equipment & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this equipment.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setEquipment(record);
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

  async function remove() {
    if (!equipment) return;
    if (!window.confirm("Delete this equipment record?")) return;
    const res = await fetch(`/api/admin/equipment/${equipment.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete equipment.");
      return;
    }
    router.push("/admin/equipment");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-4">
        <Link href="/admin/equipment" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to equipment
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Equipment not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/equipment" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to equipment
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{equipment.name}</h1>
          <p className="text-sm text-neutral-500">{equipment.assetCode}</p>
        </div>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Status"><StatusBadge value={equipment.status} /></DetailRow>
          <DetailRow label="Model">{equipment.model || "—"}</DetailRow>
          <DetailRow label="Serial no.">{equipment.serialNo || "—"}</DetailRow>
          <DetailRow label="Category">{equipment.category}</DetailRow>
          <DetailRow label="Purchase date">{formatDate(equipment.purchaseDate)}</DetailRow>
          <DetailRow label="Purchase price">{formatMoney(equipment.purchasePrice)}</DetailRow>
          <DetailRow label="Location">{equipment.location || "—"}</DetailRow>
          <DetailRow label="Maintenance jobs">{equipment._count?.maintenance ?? 0}</DetailRow>
          {equipment.vehicle && (
            <DetailRow label="Vehicle">
              <Link href={`/admin/vehicles/${equipment.vehicle.id}`} className="font-semibold text-brand-blue hover:underline">
                {equipment.vehicle.registrationNo}
              </Link>
            </DetailRow>
          )}
          {equipment.notes && <DetailRow label="Notes">{equipment.notes}</DetailRow>}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/admin/maintenance?equipmentId=${equipment.id}`}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          View maintenance
        </Link>
        <Link
          href={`/admin/vehicles/new?equipmentId=${equipment.id}`}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          Add vehicle
        </Link>
        <Link
          href={`/admin/maintenance/new?equipmentId=${equipment.id}`}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          Schedule maintenance
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit details</h2>
        <EquipmentForm initial={equipment} />
      </div>
    </div>
  );
}