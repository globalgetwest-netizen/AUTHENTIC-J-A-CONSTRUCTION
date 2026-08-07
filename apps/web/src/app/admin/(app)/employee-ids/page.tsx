"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  formatDate,
  idFullName,
  VERIFICATION_STATUSES,
  type EmployeeIdCard,
} from "@/lib/admin/types";

export default function EmployeeIdsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<EmployeeIdCard>("/api/admin/employee-ids", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<EmployeeIdCard>[] = [
    {
      key: "cardNumber",
      header: "Card no.",
      render: (c) => <span className="font-medium text-neutral-700">{c.cardNumber}</span>,
    },
    { key: "employee", header: "Employee", render: (c) => idFullName(c.employee) },
    { key: "employeeCode", header: "Staff code", render: (c) => c.employee?.employeeCode ?? "—" },
    { key: "status", header: "Status", render: (c) => <StatusBadge value={c.status} /> },
    { key: "issuedAt", header: "Issued", render: (c) => formatDate(c.issuedAt) },
    {
      key: "expiresAt",
      header: "Expires",
      render: (c) => (c.expiresAt ? formatDate(c.expiresAt) : "No expiry"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Employee IDs</h1>
          <p className="text-sm text-neutral-500">
            Physical staff ID cards with QR codes for guard-side verification.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/employee-ids/new")}>Issue ID card</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search card number, name or code…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {VERIFICATION_STATUSES.map((s) => (
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
            onRowClick={(c) => router.push(`/admin/employee-ids/${c.id}`)}
            empty="No ID cards yet. Issue your first staff card."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}