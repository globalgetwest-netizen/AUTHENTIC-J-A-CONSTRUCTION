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
  PAYMENT_STATUSES,
  type PaymentRecord,
} from "@/lib/admin/types";

export default function PaymentsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [payeeType, setPayeeType] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  const { data, meta, loading, error } = useList<PaymentRecord>(
    "/api/admin/payments",
    {
      page: String(page),
      pageSize: "15",
      search,
      payeeType,
      status,
      method,
    },
  );

  const columns: Column<PaymentRecord>[] = [
    { key: "payeeType", header: "Payee type", render: (p) => <span className="font-medium text-neutral-700">{p.payeeType}</span> },
    { key: "payeeId", header: "Payee ID", render: (p) => p.payeeId },
    { key: "method", header: "Method", render: (p) => p.method },
    { key: "amount", header: "Amount", render: (p) => formatMoney(p.amount) },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "paidOn", header: "Paid on", render: (p) => formatDate(p.paidOn) },
    { key: "reference", header: "Reference", render: (p) => p.reference || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Payments</h1>
          <p className="text-sm text-neutral-500">
            Money paid out to employees, suppliers, clients and contractors.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/payments/new")}>Add payment</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search payee, reference or notes…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <input
          value={payeeType}
          onChange={(e) => { setPayeeType(e.target.value); setPage(1); }}
          placeholder="Payee type"
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any method</option>
          {["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "CHEQUE", "OTHER"].map((m) => (
            <option key={m} value={m}>{m}</option>
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
            onRowClick={(p) => router.push(`/admin/payments/${p.id}`)}
            empty="No payments yet. Record your first payout."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}