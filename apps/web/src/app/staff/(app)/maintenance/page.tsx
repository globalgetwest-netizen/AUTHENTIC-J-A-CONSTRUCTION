"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Field, inputClass, useCatalog } from "@/lib/staff/ui";
import { formatDate, formatMoney, type Equipment, type MaintenanceRecord } from "@/lib/admin/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Schedule maintenance on a piece of plant or equipment. */
function CreateMaintenance({ onCreated }: { onCreated: () => void }) {
  const equipment = useCatalog<Equipment>("/api/staff/equipment?pageSize=100");
  const [equipmentId, setEquipmentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(today());
  const [description, setDescription] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!equipmentId) return setError("Select the equipment to service.");
    if (!description.trim()) return setError("A description of the work is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/maintenance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          scheduledAt,
          description: description.trim(),
          serviceProvider: serviceProvider.trim() || null,
          cost: cost ? Number(cost) : undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not schedule maintenance.");
      setEquipmentId("");
      setDescription("");
      setServiceProvider("");
      setCost("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule maintenance.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Schedule maintenance</h2>
        <p className="text-xs text-neutral-500">
          Plan service or repair work on plant and equipment. Records start as SCHEDULED.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Equipment *">
          <select className={inputClass} value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
            <option value="">Select equipment…</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.assetCode})</option>
            ))}
          </select>
        </Field>
        <Field label="Scheduled for *">
          <input type="date" className={inputClass} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </Field>
        <Field label="Description of work *" span>
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What needs to be serviced or repaired?"
          />
        </Field>
        <Field label="Service provider">
          <input
            className={inputClass}
            value={serviceProvider}
            onChange={(e) => setServiceProvider(e.target.value)}
            placeholder="e.g. J.A. Motors, internal workshop"
          />
        </Field>
        <Field label="Estimated cost (GHS)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
          />
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Schedule maintenance</Button>
      </div>
    </form>
  );
}

export default function StaffMaintenancePage() {
  return (
    <WorkArea<MaintenanceRecord>
      title="Maintenance"
      subtitle="Planned service and repair work on the company's plant and equipment."
      api="/api/staff/maintenance"
      searchPlaceholder="Search equipment or provider…"
      empty="No maintenance records yet. Schedule the first service above."
      form={(onCreated) => <CreateMaintenance onCreated={onCreated} />}
      columns={[
        {
          key: "equipmentId",
          header: "Equipment",
          render: (m) => (
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">{m.equipment?.name ?? "—"}</div>
              <div className="text-[11px] text-neutral-400">{m.equipment?.assetCode}</div>
            </div>
          ),
        },
        { key: "scheduledAt", header: "Scheduled for", render: (m) => formatDate(m.scheduledAt) },
        { key: "description", header: "Work", render: (m) => m.description ?? "—" },
        { key: "serviceProvider", header: "Provider", render: (m) => m.serviceProvider ?? "—" },
        {
          key: "cost",
          header: "Cost",
          render: (m) => (m.cost != null ? formatMoney(m.cost) : "—"),
        },
        { key: "status", header: "Status", render: (m) => <StatusBadge value={m.status} /> },
        {
          key: "createdBy",
          header: "Raised by",
          render: (m) => (m.createdBy ? `${m.createdBy.firstName} ${m.createdBy.lastName}` : "—"),
        },
      ]}
    />
  );
}
