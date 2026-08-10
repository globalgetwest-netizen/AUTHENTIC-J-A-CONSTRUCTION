"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatMoney, type BlockProduct } from "@/lib/admin/types";

export default function BlockProductsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");

  const { data, meta, loading, error } = useList<BlockProduct>("/api/admin/block-products", {
    page: String(page),
    pageSize: "15",
    search,
    isActive,
  });

  const columns: Column<BlockProduct>[] = [
    {
      key: "name",
      header: "Product",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{p.name}</div>
          <div className="truncate text-xs text-neutral-500">{p.code}</div>
        </div>
      ),
    },
    { key: "unitPrice", header: "Unit price", render: (p) => formatMoney(p.unitPrice) },
    { key: "productions", header: "Productions", render: (p) => p._count?.productions ?? 0 },
    { key: "sales", header: "Sales", render: (p) => p._count?.sales ?? 0 },
    { key: "isActive", header: "Status", render: (p) => <StatusBadge value={p.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Block products</h1>
          <p className="text-sm text-neutral-500">
            Block types manufactured at the factory.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/block-products/new")}>New product</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or code…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
            setPage(1);
          }}
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
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
            onRowClick={(p) => router.push(`/admin/block-products/${p.id}`)}
            empty="No block products yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
