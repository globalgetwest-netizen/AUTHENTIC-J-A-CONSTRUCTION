"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  EMPLOYEE_STATUSES,
  formatDate,
  formatMoney,
  label,
  type Employee,
} from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/employees/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Employee & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this employee.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setEmployee(record);
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
    if (!employee || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setEmployee({ ...employee, status: next as Employee["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!employee) return;
    if (!window.confirm("Delete this employee? This cannot be undone.")) return;
    await fetch(`/api/admin/employees/${employee.id}`, { method: "DELETE" });
    router.push("/admin/employees");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <Link href="/admin/employees" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to employees
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Employee not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit {employee.firstName} {employee.lastName}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <EmployeeForm initial={employee} employeeId={employee.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/employees" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to employees
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <StatusBadge value={employee.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/admin/employees/${employee.id}/certificate`}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Download worker certificate
          </a>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Emp. No.">
            <span className="font-medium text-neutral-900">{employee.employeeCode}</span>
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={employee.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Full name">
            {[employee.firstName, employee.lastName, employee.otherNames].filter(Boolean).join(" ")}
          </DetailRow>
          <DetailRow label="Email">{employee.email || "—"}</DetailRow>
          <DetailRow label="Phone">{employee.phone || "—"}</DetailRow>
          <DetailRow label="National ID">{employee.nationalId || "—"}</DetailRow>
          <DetailRow label="Gender">{label(employee.gender)}</DetailRow>
          <DetailRow label="Date of birth">{formatDate(employee.dateOfBirth)}</DetailRow>
          <DetailRow label="Address">{employee.address || "—"}</DetailRow>
          <DetailRow label="Department">{employee.department?.name || "—"}</DetailRow>
          <DetailRow label="Position">{employee.position?.title || "—"}</DetailRow>
          <DetailRow label="Branch">{employee.branch?.name || "—"}</DetailRow>
          <DetailRow label="Employment type">{label(employee.employmentType)}</DetailRow>
          <DetailRow label="Hire date">{formatDate(employee.hireDate)}</DetailRow>
          <DetailRow label="Termination date">{formatDate(employee.terminationDate)}</DetailRow>
          <DetailRow label="Salary">
            <span className="font-medium text-neutral-900">{formatMoney(employee.salary)}</span>
          </DetailRow>
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
        Delete employee
      </button>
    </div>
  );
}
