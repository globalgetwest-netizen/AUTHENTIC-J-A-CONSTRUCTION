"use client";

import { useEffect, useState } from "react";

interface ChartHead {
  id: string;
  firstName: string;
  lastName: string;
  position: { title: string };
}

interface ChartEmployee extends ChartHead {
  reportsToId: string | null;
  position: { title: string; level: number };
}

interface ChartDepartment {
  id: string;
  name: string;
  code: string;
  head: ChartHead | null;
  employees: ChartEmployee[];
}

interface OrgChartData {
  company: { id: string; name: string };
  ceo: ChartHead | null;
  departments: ChartDepartment[];
}

function nameOf(person: { firstName: string; lastName: string } | null | undefined): string {
  return person ? `${person.firstName} ${person.lastName}` : "—";
}

/**
 * Command hierarchy chart: CEO at the top, then each department column with its
 * head and staff. Pure CSS/flex — no chart library. Read-only view; the CRUD
 * panels below still manage the records.
 */
export function OrgChart() {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/org-chart", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (OrgChartData & { message?: string }) | null;
        if (!res.ok || !body || !body.company) throw new Error(body?.message ?? "Could not load the org chart.");
        return body;
      })
      .then((record) => {
        if (!cancelled) setData(record);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading org chart…
      </div>
    );
  }

  const hasDepartments = data.departments.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-neutral-900">Command hierarchy</h2>
        <p className="text-xs text-neutral-500">
          {data.company.name} · reporting lines from the Chief Executive down to every department.
        </p>
      </div>

      <div className="px-5 py-6">
        {/* CEO node */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-xs rounded-lg border-2 border-brand-blue bg-brand-blue px-4 py-3 text-center text-white shadow-sm">
            <div className="text-sm font-bold">{nameOf(data.ceo)}</div>
            <div className="text-xs text-white/85">
              {data.ceo?.position?.title ?? "Chief Executive Officer"}
            </div>
          </div>
          <div className="h-5 w-px bg-neutral-300" />
          <div className="h-px w-full bg-neutral-300" />
        </div>

        {!hasDepartments ? (
          <p className="mt-6 text-center text-sm text-neutral-500">
            No departments yet — create departments and assign heads to build the hierarchy.
          </p>
        ) : (
          <div className="mt-0 flex gap-4 overflow-x-auto pb-2 pt-5">
            {data.departments.map((dep) => {
              const headId = dep.head?.id ?? null;
              const staff = dep.employees.filter((e) => e.id !== headId);
              return (
                <div
                  key={dep.id}
                  className="flex w-60 shrink-0 flex-col rounded-lg border border-neutral-200"
                >
                  {/* Department header */}
                  <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                    <div className="text-sm font-bold text-neutral-900">{dep.name}</div>
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400">
                      {dep.code}
                    </div>
                  </div>

                  {/* Head */}
                  <div className="flex items-start gap-2 border-b border-neutral-100 px-3 py-2.5">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs text-white"
                      title="Department head"
                    >
                      {dep.head ? `${dep.head.firstName[0]}${dep.head.lastName[0]}` : "—"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-900">
                        {nameOf(dep.head)}
                      </div>
                      <div className="truncate text-[11px] text-neutral-500">
                        {dep.head?.position?.title ?? "Department head"}
                      </div>
                    </div>
                  </div>

                  {/* Staff */}
                  <div className="flex-1 space-y-1 px-3 py-2.5">
                    {staff.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-neutral-400">
                        No staff assigned yet
                      </p>
                    ) : (
                      staff.map((emp) => (
                        <div key={emp.id} className="flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                            {`${emp.firstName[0]}${emp.lastName[0]}`}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-medium text-neutral-800">
                              {nameOf(emp)}
                            </div>
                            <div className="truncate text-[10px] text-neutral-400">
                              {emp.position?.title ?? "Staff"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
