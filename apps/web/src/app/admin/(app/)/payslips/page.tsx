"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { PAYROLL_STATUSES, formatDate, formatMoney, fullName, type Payslip } from "@/lib/admin/types";

export default function PayslipsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<Payslip>("/api/admin/payslips", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<Payslip>[] = [
    { key: "payslipNo", header: "Payslip", render: (s) => <span className="font-medium text-neutral-700">{s.payslipNo}</span> },
    { key: "employeeId", header: "Employee", render: (s) => fullName(s.employee) },
    { key: "periodId", header: "Period", render: (s) => s.period?.name ?? "—" },
    { key: "netPay", header: "Net pay", render: (s) => formatMoney(s.netPay) },
    { key: "issuedAt", header: "Issued", render: (s) => formatDate(s.issuedAt) },
    { key: "status", header: "Status", render: (s) => <StatusBadge value={s.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Payslips</h1>
        <p className="text-sm text-neutral-500">
          Print-ready payslips issued to employees after a payrun is processed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search payslip no…"
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
            onRowClick={(s) => router.push(`/admin/payslips/${s.id}`)}
            empty="No payslips issued yet. Process a payrun and issue payslips."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}