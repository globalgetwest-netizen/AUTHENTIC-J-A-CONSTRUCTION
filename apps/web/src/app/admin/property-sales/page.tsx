"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatDate, formatMoney, label, SALE_STATUSES, type PropertySale } from "@/lib/admin/types";

export default function PropertySalesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<PropertySale>("/api/admin/property-sales", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<PropertySale>[] = [
    { key: "saleCode", header: "Sale No." },
    {
      key: "property",
      header: "Property",
      render: (s) => s.property?.name || "—",
    },
    { key: "client", header: "Client", render: (s) => s.client?.companyName || s.client?.contactName || "—" },
    {
      key: "price",
      header: "Price",
      render: (s) => <span className="font-medium text-neutral-900">{formatMoney(s.price)}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      render: (s) => <span className="font-medium text-neutral-900">{formatMoney(s.balanceAmount)}</span>,
    },
    { key: "status", header: "Status", render: (s) => <StatusBadge value={s.status} /> },
    { key: "saleDate", header: "Sale date", render: (s) => formatDate(s.saleDate) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Property sales</h1>
          <p className="text-sm text-neutral-500">
            Sales and ownership — completed sales generate a certificate.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/property-sales/new")}>New sale</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by sale no. or client…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All statuses</option>
          {SALE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
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
            onRowClick={(s) => router.push(`/admin/property-sales/${s.id}`)}
            empty="No sales yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
