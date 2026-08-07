"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { type Employee } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

/** Issue a fresh staff ID card for a chosen employee (revoking any live card). */
export function EmployeeIdIssueForm() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/employees?pageSize=100", { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((body) => {
        if (cancelled) return;
        const list = (body as { data?: Employee[] } | null)?.data;
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        // Options list is a convenience; the form still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return setError("Select the employee to issue a card for.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/employee-ids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeId,
          ...(expiresAt ? { expiresAt } : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not issue the ID card.");
      const id = body?.id;
      if (id) {
        router.push(`/admin/employee-ids/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the ID card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div>
        <label className={labelClass} htmlFor="eid-employee">
          Employee *
        </label>
        <select
          id="eid-employee"
          className={inputClass}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">Select an employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} ({emp.employeeCode})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="eid-expires">
          Expiry date (optional)
        </label>
        <input
          id="eid-expires"
          type="date"
          className={inputClass}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="mt-1 text-xs text-neutral-500">
          Leave blank for a card that never expires.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>Issue ID card</Button>
        <Link
          href="/admin/employee-ids"
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}