"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { type Asset, type Employee } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function AssetAssignmentForm() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assetId, setAssetId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedById, setAssignedById] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/assets?pageSize=100", { cache: "no-store" }).then((r) =>
        r.json().catch(() => null),
      ),
      fetch("/api/admin/employees?pageSize=100", { cache: "no-store" }).then((r) =>
        r.json().catch(() => null),
      ),
    ])
      .then(([assetsBody, employeesBody]) => {
        if (cancelled) return;
        const a = (assetsBody as { data?: Asset[] } | null)?.data;
        const e = (employeesBody as { data?: Employee[] } | null)?.data;
        setAssets(Array.isArray(a) ? a : []);
        setEmployees(Array.isArray(e) ? e : []);
      })
      .catch(() => {
        // Options lists are a convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId) return setError("Select the asset to assign.");
    if (!assignedToId) return setError("Select the employee to assign it to.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/asset-assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assetId,
          assignedToId,
          assignedById: assignedById || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not create the assignment.");
      const id = body?.id;
      if (id) {
        router.push(`/admin/asset-assignments/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the assignment.");
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
          <label className={labelClass} htmlFor="aa-asset">
            Asset *
          </label>
          <select
            id="aa-asset"
            className={inputClass}
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            <option value="">Select an asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.assetCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="aa-assigned-to">
            Assigned to *
          </label>
          <select
            id="aa-assigned-to"
            className={inputClass}
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            <option value="">Select an employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="aa-assigned-by">
            Assigned by (optional)
          </label>
          <select
            id="aa-assigned-by"
            className={inputClass}
            value={assignedById}
            onChange={(e) => setAssignedById(e.target.value)}
          >
            <option value="">Select an employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="aa-notes">
            Notes
          </label>
          <textarea
            id="aa-notes"
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. issued for the Kumasi site, return when project wraps."
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          Create assignment
        </Button>
        <Link
          href="/admin/asset-assignments"
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}