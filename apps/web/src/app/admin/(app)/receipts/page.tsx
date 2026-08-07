"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";
import {
  PAYMENT_METHODS,
  formatDate,
  formatMoney,
  type Receipt,
} from "@/lib/admin/types";

export default function ReceiptsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");

  const { data, meta, loading, error } = useList<Receipt>("/api/admin/receipts", {
    page: String(page),
    pageSize: "15",
    search,
    method,
  });

  const columns: Column<Receipt>[] = [
    { key: "receiptNo", header: "Receipt", render: (r) => <span className="font-medium text-neutral-700">{r.receiptNo}</span> },
    { key: "clientId", header: "Client", render: (r) => r.client?.companyName || r.client?.contactName || "—" },
    { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount) },
    { key: "receivedOn", header: "Received on", render: (r) => formatDate(r.receivedOn) },
    { key: "method", header: "Method", render: (r) => r.method },
    { key: "invoiceId", header: "Invoice", render: (r) => r.invoice?.invoiceNo || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Receipts</h1>
          <p className="text-sm text-neutral-500">
            Payments received from clients, tracked against invoices.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/receipts/new")}>Add receipt</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search receipt no. or reference…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any method</option>
          {PAYMENT_METHODS.map((m) => (
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
            onRowClick={(r) => router.push(`/admin/receipts/${r.id}`)}
            empty="No receipts yet. Record your first client payment."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}