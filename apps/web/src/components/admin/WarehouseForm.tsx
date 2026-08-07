"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { Employee, Warehouse } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function WarehouseForm({ initial = null }: { initial?: Warehouse | null }) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState(initial?.name ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [managerId, setManagerId] = useState(initial?.managerId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/employees?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: Employee[] } | null;
        if (!cancelled && body?.data) setEmployees(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("A name is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/warehouses/${initial.id}` : "/api/admin/warehouses",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim() || null,
            address: address.trim() || null,
            managerId: managerId || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save warehouse.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/warehouses/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save warehouse.");
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
          <label className={labelClass} htmlFor="wh-name">
            Name *
          </label>
          <input
            id="wh-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Main yard — Kenyase"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="wh-location">
            Location
          </label>
          <input
            id="wh-location"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Kenyase – Brofoyedru"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="wh-address">
            Address
          </label>
          <input
            id="wh-address"
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="wh-manager">
            Manager
          </label>
          <select
            id="wh-manager"
            className={inputClass}
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          >
            <option value="">No manager</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Create warehouse"}
        </Button>
        <a
          href={initial ? `/admin/warehouses/${initial.id}` : "/admin/warehouses"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
