"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  PAYMENT_STATUSES,
  formatDate,
  formatMoney,
  type BlockSale,
} from "@/lib/admin/types";

export default function BlockSalesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<BlockSale>("/api/admin/block-sales", {
    page: String(page),
    pageSize: "15",
    search,
    status,
  });

  const columns: Column<BlockSale>[] = [
    { key: "reference", header: "Reference", render: (s) => s.reference || "—" },
    { key: "product", header: "Product", render: (s) => s.product?.name || "—" },
    { key: "client", header: "Client", render: (s) => s.client?.companyName || s.client?.contactName || "—" },
    { key: "quantity", header: "Qty", render: (s) => <span className="font-medium text-neutral-700">{s.quantity}</span> },
    { key: "totalAmount", header: "Total", render: (s) => formatMoney(s.totalAmount) },
    { key: "soldOn", header: "Sold on", render: (s) => formatDate(s.soldOn) },
    { key: "status", header: "Status", render: (s) => <StatusBadge value={s.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Block sales</h1>
          <p className="text-sm text-neutral-500">
            Sales of factory blocks to clients and walk-in buyers.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/block-sales/new")}>New sale</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search reference or product…"
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
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
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
            onRowClick={(s) => router.push(`/admin/block-sales/${s.id}`)}
            empty="No block sales yet. Record your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
