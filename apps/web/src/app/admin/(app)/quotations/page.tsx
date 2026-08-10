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
  label,
  QUOTATION_STATUSES,
  type Quotation,
} from "@/lib/admin/types";

export default function QuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<Quotation>("/api/admin/quotations", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<Quotation>[] = [
    { key: "quotationNo", header: "Quote No." },
    {
      key: "title",
      header: "Title",
      render: (q) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{q.title}</div>
          <div className="truncate text-xs text-neutral-500">
            {q.client?.companyName || q.client?.contactName || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (q) => <span className="font-medium text-neutral-900">{formatMoney(q.total)}</span>,
    },
    { key: "status", header: "Status", render: (q) => <StatusBadge value={q.status} /> },
    { key: "createdAt", header: "Issued", render: (q) => formatDate(q.issuedAt ?? q.createdAt) },
    {
      key: "pdf",
      header: "",
      render: (q) => (
        <a
          href={`/api/admin/quotations/${q.id}/pdf`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          PDF
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Quotations</h1>
          <p className="text-sm text-neutral-500">
            Price estimates issued to clients, saved and downloadable as PDFs.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/quotations/new")}>New quotation</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by number or title…"
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
          {QUOTATION_STATUSES.map((s) => (
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
            onRowClick={(q) => router.push(`/admin/quotations/${q.id}`)}
            empty="No quotations yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}