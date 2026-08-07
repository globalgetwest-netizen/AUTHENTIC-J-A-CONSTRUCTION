"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { PayrollPeriod } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Create or edit a pay period (name + date range). Period meta is only editable
 * while the period is still DRAFT; once processed the API rejects changes.
 */
export function PayrollPeriodForm({ initial = null }: { initial?: PayrollPeriod | null }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [startDate, setStartDate] = useState(
    initial?.startDate ? initial.startDate.slice(0, 10) : monthStart(),
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ? initial.endDate.slice(0, 10) : today(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("A period name is required.");
    if (!startDate || !endDate) return setError("A start and end date are required.");
    if (endDate < startDate) return setError("The end date must be on or after the start date.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/payroll-periods/${initial.id}` : "/api/admin/payroll-periods",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            startDate,
            endDate,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save pay period.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/payrolls/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save pay period.");
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
          <label className={labelClass} htmlFor="pp-name">Period name *</label>
          <input
            id="pp-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. August 2026"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pp-start">Start date *</label>
          <input
            id="pp-start"
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pp-end">End date *</label>
          <input
            id="pp-end"
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {initial ? "Save changes" : "Create pay period"}
        </Button>
        <a
          href={initial ? `/admin/payrolls/${initial.id}` : "/admin/payrolls"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}