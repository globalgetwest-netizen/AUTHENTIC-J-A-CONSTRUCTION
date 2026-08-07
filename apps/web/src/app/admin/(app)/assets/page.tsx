"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatMoney, type Asset } from "@/lib/admin/types";

export default function AssetsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<Asset>("/api/admin/assets", {
    page: String(page),
    pageSize: "15",
    search,
    category,
    status,
  });

  const columns: Column<Asset>[] = [
    { key: "assetCode", header: "Code", render: (a) => <span className="font-medium text-neutral-700">{a.assetCode}</span> },
    { key: "name", header: "Name", render: (a) => a.name },
    { key: "category", header: "Category", render: (a) => a.category },
    { key: "status", header: "Status", render: (a) => <StatusBadge value={a.status} /> },
    { key: "currentValue", header: "Current value", render: (a) => formatMoney(a.currentValue) },
    { key: "location", header: "Location", render: (a) => a.location || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Assets</h1>
          <p className="text-sm text-neutral-500">
            Company property and valuables tracked by code and value.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/assets/new")}>Add asset</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or code…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <input
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder="Category"
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {["ACTIVE", "IN_REPAIR", "RETIRED", "DISPOSED"].map((s) => (
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
            onRowClick={(a) => router.push(`/admin/assets/${a.id}`)}
            empty="No assets yet. Add your first asset."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}