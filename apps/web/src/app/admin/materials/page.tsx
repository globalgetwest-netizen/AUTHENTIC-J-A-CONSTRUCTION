"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatMoney, type Material, type MaterialCategory } from "@/lib/admin/types";

export default function MaterialsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [categories, setCategories] = useState<MaterialCategory[]>([]);

  const { data, meta, loading, error } = useList<Material>("/api/admin/materials", {
    page: String(page),
    pageSize: "15",
    search,
    categoryId,
    isActive,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/material-categories?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: MaterialCategory[] } | null;
        if (!cancelled && body?.data) setCategories(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<Material>[] = [
    {
      key: "name",
      header: "Material",
      render: (m) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{m.name}</div>
          <div className="truncate text-xs text-neutral-500">{m.sku}</div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (m) => m.category?.name || "—" },
    { key: "unit", header: "Unit", render: (m) => m.unit || "—" },
    {
      key: "currentStock",
      header: "Stock",
      render: (m) => (
        <span className="font-medium text-neutral-700">
          {m.currentStock} {m.unit}
        </span>
      ),
    },
    { key: "costPerUnit", header: "Cost/unit", render: (m) => formatMoney(m.costPerUnit) },
    { key: "isActive", header: "Status", render: (m) => <StatusBadge value={m.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Materials</h1>
          <p className="text-sm text-neutral-500">
            Construction materials stocked across warehouses.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/materials/new")}>New material</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or SKU…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="w-52 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
            onRowClick={(m) => router.push(`/admin/materials/${m.id}`)}
            empty="No materials yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
