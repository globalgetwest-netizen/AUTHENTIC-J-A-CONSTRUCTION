"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";
import { type Warehouse } from "@/lib/admin/types";

export default function WarehousesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<Warehouse>("/api/admin/warehouses", {
    page: String(page),
    pageSize: "15",
    search,
  });

  const columns: Column<Warehouse>[] = [
    {
      key: "name",
      header: "Warehouse",
      render: (w) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{w.name}</div>
          <div className="truncate text-xs text-neutral-500">{w.code}</div>
        </div>
      ),
    },
    { key: "location", header: "Location", render: (w) => w.location || "—" },
    { key: "stock", header: "Stock lines", render: (w) => w._count?.inventory ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Warehouses</h1>
          <p className="text-sm text-neutral-500">
            Storage locations where materials are stocked and moved between.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/warehouses/new")}>New warehouse</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, code or location…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
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
            onRowClick={(w) => router.push(`/admin/warehouses/${w.id}`)}
            empty="No warehouses yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
