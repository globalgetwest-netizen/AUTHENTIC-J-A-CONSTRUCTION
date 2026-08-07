"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { MaintenanceForm } from "@/components/admin/MaintenanceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, type MaintenanceRecord } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [completing, setCompleting] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    fetch(`/api/admin/maintenance/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (MaintenanceRecord & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this record.");
        return body;
      })
      .then((data) => {
        if (!cancelled) {
          setRecord(data);
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

  useEffect(() => load(), [load]);

  async function remove() {
    if (!record) return;
    if (!window.confirm("Delete this maintenance record?")) return;
    const res = await fetch(`/api/admin/maintenance/${record.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete this record.");
      return;
    }
    router.push("/admin/maintenance");
    router.refresh();
  }

  async function complete() {
    if (!record) return;
    setCompleting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/maintenance/${record.id}/complete`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setMessage(body?.message ?? "Could not complete this job.");
        return;
      }
      setMessage("");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not complete this job.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Link href="/admin/maintenance" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to maintenance
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Maintenance record not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/maintenance" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to maintenance
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            {record.equipment?.name ? `Maintenance — ${record.equipment.name}` : "Maintenance job"}
          </h1>
          <p className="text-sm text-neutral-500">
            {record.equipment ? `${record.equipment.assetCode}` : "Equipment record"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {record.status !== "COMPLETED" && (
            <Button variant="secondary" loading={completing} onClick={complete}>Complete</Button>
          )}
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Status"><StatusBadge value={record.status} /></DetailRow>
          <DetailRow label="Equipment">
            {record.equipment ? (
              <Link href={`/admin/equipment/${record.equipment.id}`} className="font-semibold text-brand-blue hover:underline">
                {record.equipment.name} ({record.equipment.assetCode})
              </Link>
            ) : "—"}
          </DetailRow>
          <DetailRow label="Scheduled">{formatDate(record.scheduledAt)}</DetailRow>
          <DetailRow label="Completed">{formatDate(record.completedAt)}</DetailRow>
          <DetailRow label="Cost">{formatMoney(record.cost)}</DetailRow>
          <DetailRow label="Service provider">{record.serviceProvider || "—"}</DetailRow>
          {record.description && <DetailRow label="Description">{record.description}</DetailRow>}
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit details</h2>
        <MaintenanceForm initial={record} />
      </div>
    </div>
  );
}