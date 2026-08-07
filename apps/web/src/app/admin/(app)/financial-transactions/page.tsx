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
  formatMoney,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_TYPES,
  type FinancialTransaction,
} from "@/lib/admin/types";

export default function FinancialTransactionsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<FinancialTransaction>(
    "/api/admin/financial-transactions",
    {
      page: String(page),
      pageSize: "15",
      search,
      type,
      direction,
      status,
    },
  );

  const columns: Column<FinancialTransaction>[] = [
    { key: "transactionNo", header: "No.", render: (t) => <span className="font-medium text-neutral-700">{t.transactionNo}</span> },
    { key: "type", header: "Type", render: (t) => t.type },
    { key: "direction", header: "Direction", render: (t) => t.direction },
    { key: "category", header: "Category", render: (t) => t.category },
    { key: "amount", header: "Amount", render: (t) => formatMoney(t.amount) },
    { key: "status", header: "Status", render: (t) => <StatusBadge value={t.status} /> },
    { key: "occurredOn", header: "Date", render: (t) => formatDate(t.occurredOn) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Financial transactions</h1>
          <p className="text-sm text-neutral-500">
            Income, expenses, transfers and adjustments recorded on the ledger.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/financial-transactions/new")}>Add transaction</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search reference, account or category…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any type</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => { setDirection(e.target.value); setPage(1); }}
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any direction</option>
          {TRANSACTION_DIRECTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {["PENDING", "PART_PAID", "PAID", "REFUNDED", "FAILED", "CANCELLED"].map((s) => (
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
            onRowClick={(t) => router.push(`/admin/financial-transactions/${t.id}`)}
            empty="No transactions yet. Add your first ledger entry."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}