"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  formatMoney,
  type Equipment,
} from "@/lib/admin/types";

export default function EquipmentListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const { data, meta, loading, error } = useList<Equipment>("/api/admin/equipment", {
    page: String(page),
    pageSize: "15",
    search,
    category,
    status,
  });

  const columns: Column<Equipment>[] = [
    { key: "assetCode", header: "Code", render: (e) => <span className="font-medium text-neutral-700">{e.assetCode}</span> },
    { key: "name", header: "Name", render: (e) => e.name },
    { key: "model", header: "Model", render: (e) => e.model || "—" },
    { key: "category", header: "Category", render: (e) => e.category },
    { key: "status", header: "Status", render: (e) => <StatusBadge value={e.status} /> },
    { key: "purchasePrice", header: "Cost", render: (e) => formatMoney(e.purchasePrice) },
    { key: "location", header: "Location", render: (e) => e.location || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Equipment</h1>
          <p className="text-sm text-neutral-500">
            Heavy machinery, vehicles and plant owned by the company.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/equipment/new")}>Add equipment</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, code or model…"
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
          {["AVAILABLE", "IN_USE", "MAINTENANCE", "RESERVED", "RETIRED"].map((s) => (
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
            onRowClick={(e) => router.push(`/admin/equipment/${e.id}`)}
            empty="No equipment yet. Add your first machine."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}