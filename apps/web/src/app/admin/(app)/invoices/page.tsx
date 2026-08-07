"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatDate, formatMoney, INVOICE_STATUSES, type Invoice } from "@/lib/admin/types";

function clientName(c: Invoice["client"]): string {
  if (!c) return "—";
  return c.companyName || c.contactName || c.clientCode || "—";
}

export default function InvoicesListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<Invoice>("/api/admin/invoices", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<Invoice>[] = [
    { key: "invoiceNo", header: "Invoice", render: (inv) => <span className="font-medium text-neutral-700">{inv.invoiceNo}</span> },
    { key: "client", header: "Client", render: (inv) => clientName(inv.client) },
    { key: "issuedOn", header: "Issued", render: (inv) => formatDate(inv.issuedOn) },
    { key: "dueOn", header: "Due", render: (inv) => formatDate(inv.dueOn) },
    { key: "total", header: "Total", render: (inv) => formatMoney(inv.total) },
    { key: "status", header: "Status", render: (inv) => <StatusBadge value={inv.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-sm text-neutral-500">Bills raised to clients for works or services.</p>
        </div>
        <Button onClick={() => router.push("/admin/invoices/new")}>New invoice</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search invoice no. or client…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {INVOICE_STATUSES.map((s) => (
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
            onRowClick={(inv) => router.push(`/admin/invoices/${inv.id}`)}
            empty="No invoices yet. Raise your first invoice."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}