"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  EXPENSE_STATUSES,
  formatDate,
  formatMoney,
  type Expense,
} from "@/lib/admin/types";

export default function ExpensesListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<Expense>("/api/admin/expenses", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<Expense>[] = [
    { key: "expenseNo", header: "Expense", render: (e) => <span className="font-medium text-neutral-700">{e.expenseNo}</span> },
    { key: "description", header: "Description", render: (e) => e.description },
    { key: "category", header: "Category", render: (e) => e.category },
    { key: "amount", header: "Amount", render: (e) => formatMoney(e.amount) },
    { key: "incurredOn", header: "Incurred on", render: (e) => formatDate(e.incurredOn) },
    { key: "projectId", header: "Project", render: (e) => e.project ? `${e.project.name} (${e.project.code})` : "—" },
    { key: "status", header: "Status", render: (e) => <StatusBadge value={e.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Expenses</h1>
          <p className="text-sm text-neutral-500">
            Company spend across projects and operational categories.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/expenses/new")}>Add expense</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search description or category…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {EXPENSE_STATUSES.map((s) => (
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
            onRowClick={(e) => router.push(`/admin/expenses/${e.id}`)}
            empty="No expenses yet. Add your first spend."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}