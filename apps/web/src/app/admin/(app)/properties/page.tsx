"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatMoney, label, PROPERTY_STATUSES, type Property } from "@/lib/admin/types";

export default function PropertiesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<Property>("/api/admin/properties", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<Property>[] = [
    { key: "code", header: "Code" },
    {
      key: "name",
      header: "Property",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{p.name}</div>
          <div className="truncate text-xs text-neutral-500">{p.address || "—"}</div>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (p) => p.propertyType?.name || "—" },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    {
      key: "price",
      header: "Price",
      render: (p) => <span className="font-medium text-neutral-900">{formatMoney(p.price)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Properties</h1>
          <p className="text-sm text-neutral-500">
            Real estate owned and sold — ownership certificates are generated from sales.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/properties/new")}>New property</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by code, name or address…"
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
          {PROPERTY_STATUSES.map((s) => (
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
            onRowClick={(p) => router.push(`/admin/properties/${p.id}`)}
            empty="No properties yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
