"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@ajac/ui";
import { type Employee, type ProjectMember } from "@/lib/admin/types";

function memberName(m: ProjectMember): string {
  const e = m.employee;
  return e ? `${e.firstName} ${e.lastName} (${e.employeeCode})` : m.employeeId;
}

export function ProjectMembersSection({ projectId }: { projectId: string }) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch(`/api/admin/projects/${projectId}/members`, { cache: "no-store" }).then((r) =>
        r.json().catch(() => []),
      ),
      fetch(`/api/admin/employees?pageSize=100&status=ACTIVE`, { cache: "no-store" }).then((r) =>
        r.json().catch(() => ({ data: [] })),
      ),
    ])
      .then(([memberBody, empBody]) => {
        setMembers(Array.isArray(memberBody) ? memberBody : []);
        const rows = (empBody as { data?: Employee[] }).data;
        setEmployees(Array.isArray(rows) ? rows : []);
        setError("");
      })
      .catch(() => setError("Failed to load members."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!employeeId || !role.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employeeId, role: role.trim() }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not add the member.");
      setEmployeeId("");
      setRole("");
      setMessage("Member added.");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add the member.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: ProjectMember) {
    if (!window.confirm(`Remove ${memberName(m)} from this project?`)) return;
    const res = await fetch(`/api/admin/projects/${projectId}/members/${m.id}`, { method: "DELETE" });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) {
      setMessage(body?.message ?? "Could not remove the member.");
      return;
    }
    setMessage("Member removed.");
    load();
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-900">Team</h2>
      <p className="mb-3 text-xs text-neutral-500">Staff assigned to work on this project.</p>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 text-xs text-neutral-500">{message}</p>}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Select an employee…</option>
          {employees
            .filter((e) => !members.some((m) => m.employeeId === e.id))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
        </select>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role, e.g. SITE_SUPERVISOR"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <Button type="button" variant="primary" size="sm" onClick={add} disabled={busy || !employeeId || !role.trim()}>
          Add
        </Button>
      </div>

      {loading ? (
        <p className="py-4 text-center text-sm text-neutral-400">Loading team…</p>
      ) : members.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">No members assigned yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{memberName(m)}</p>
                <p className="text-xs text-neutral-500">{m.role}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(m)}
                className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
