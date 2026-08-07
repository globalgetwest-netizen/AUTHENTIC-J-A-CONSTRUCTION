"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  MAINTENANCE_STATUSES,
  type Equipment,
  type MaintenanceRecord,
  type MaintenanceStatus,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function MaintenanceForm({ initial = null, equipmentId = "" }: { initial?: MaintenanceRecord | null; equipmentId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentIdState, setEquipmentIdState] = useState(initial?.equipmentId ?? equipmentId ?? searchParams.get("equipmentId") ?? "");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ? initial.scheduledAt.slice(0, 10) : "");
  const [completedAt, setCompletedAt] = useState(initial?.completedAt ? initial.completedAt.slice(0, 10) : "");
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : "");
  const [serviceProvider, setServiceProvider] = useState(initial?.serviceProvider ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<MaintenanceStatus>(initial?.status ?? "SCHEDULED");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/equipment?pageSize=100", { cache: "no-store" })
      .then(async (res) => res.json().catch(() => null))
      .then((body) => {
        if (!cancelled && body?.data) setEquipments(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!equipmentIdState) return setError("Choose the equipment this job is for.");
    if (!scheduledAt) return setError("A scheduled date is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/maintenance/${initial.id}` : "/api/admin/maintenance",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            equipmentId: equipmentIdState,
            scheduledAt,
            completedAt: completedAt || null,
            ...(cost !== "" ? { cost: Number(cost) } : {}),
            serviceProvider: serviceProvider.trim() || null,
            description: description.trim() || null,
            status,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save maintenance job.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/maintenance/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save maintenance job.");
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
          <label className={labelClass} htmlFor="mn-equipment">Equipment *</label>
          <select
            id="mn-equipment"
            className={inputClass}
            value={equipmentIdState}
            onChange={(e) => setEquipmentIdState(e.target.value)}
          >
            <option value="">Select equipment…</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.assetCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="mn-scheduled">Scheduled date *</label>
          <input id="mn-scheduled" type="date" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="mn-status">Status</label>
          <select id="mn-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="mn-cost">Cost (GHS)</label>
          <input id="mn-cost" type="number" min="0" step="0.01" className={inputClass} value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="mn-provider">Service provider</label>
          <input id="mn-provider" className={inputClass} value={serviceProvider} onChange={(e) => setServiceProvider(e.target.value)} placeholder="Vendor / workshop" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="mn-completed">Completed date</label>
          <input id="mn-completed" type="date" className={inputClass} value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="mn-desc">Description</label>
          <textarea id="mn-desc" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Work carried out…" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add maintenance"}</Button>
        <a
          href={initial ? `/admin/maintenance/${initial.id}` : "/admin/maintenance"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}