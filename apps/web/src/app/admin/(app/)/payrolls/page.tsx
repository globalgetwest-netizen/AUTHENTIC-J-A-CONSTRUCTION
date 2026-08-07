"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { PAYROLL_STATUSES, formatDate, type PayrollPeriod } from "@/lib/admin/types";

export default function PayrollPeriodsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<PayrollPeriod>("/api/admin/payroll-periods", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<PayrollPeriod>[] = [
    { key: "name", header: "Period", render: (p) => <span className="font-medium text-neutral-700">{p.name}</span> },
    { key: "startDate", header: "From", render: (p) => formatDate(p.startDate) },
    { key: "endDate", header: "To", render: (p) => formatDate(p.endDate) },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge value={p.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Pay periods</h1>
          <p className="text-sm text-neutral-500">
            Monthly payroll cycles. Generate runs, then process and issue payslips.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/payrolls/new")}>New pay period</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search period name…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {PAYROLL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading…
        </div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={data}
            onRowClick={(p) => router.push(`/admin/payrolls/${p.id}`)}
            empty="No pay periods yet. Create your first pay period."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}