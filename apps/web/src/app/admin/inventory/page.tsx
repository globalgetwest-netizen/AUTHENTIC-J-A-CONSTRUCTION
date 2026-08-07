"use client";

import { useEffect, useState } from "react";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StockOpModal, type StockOpMode } from "@/components/admin/StockOpModal";
import { useList } from "@/lib/admin/useList";
import type { Inventory, Material, MaterialCategory, Warehouse } from "@/lib/admin/types";

const smButton =
  "rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 transition hover:border-brand-blue hover:text-brand-blue";

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [op, setOp] = useState<{
    mode: StockOpMode | null;
    defaults?: { materialId?: string; warehouseId?: string } | null;
    key: number;
  }>({ mode: null, defaults: null, key: 0 });

  const openOp = (mode: StockOpMode, defaults?: { materialId?: string; warehouseId?: string }) =>
    setOp((prev) => ({ mode, defaults: defaults ?? null, key: prev.key + 1 }));

  const { data, meta, loading, error, reload } = useList<Inventory>("/api/admin/inventory", {
    page: String(page),
    pageSize: "15",
    search,
    warehouseId,
    categoryId,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/warehouses?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/material-categories?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/materials?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([whRes, catRes, matRes]) => {
        const [wh, cat, mat] = await Promise.all([
          whRes.json().catch(() => null),
          catRes.json().catch(() => null),
          matRes.json().catch(() => null),
        ]);
        if (cancelled) return;
        if (wh?.data) setWarehouses(wh.data);
        if (cat?.data) setCategories(cat.data);
        if (mat?.data) setMaterials(mat.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<Inventory>[] = [
    {
      key: "material",
      header: "Material",
      render: (inv) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{inv.material?.name || "—"}</div>
          <div className="truncate text-xs text-neutral-500">{inv.material?.sku}</div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (inv) => inv.material?.category?.name || "—" },
    { key: "warehouse", header: "Warehouse", render: (inv) => inv.warehouse?.name || "—" },
    {
      key: "quantity",
      header: "Quantity",
      render: (inv) => (
        <span className="font-medium text-neutral-900">
          {inv.quantity} {inv.material?.unit || ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (inv) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={smButton}
            onClick={(e) => {
              e.stopPropagation();
              openOp("receive", { materialId: inv.materialId, warehouseId: inv.warehouseId });
            }}
          >
            Receive
          </button>
          <button
            type="button"
            className={smButton}
            onClick={(e) => {
              e.stopPropagation();
              openOp("issue", { materialId: inv.materialId, warehouseId: inv.warehouseId });
            }}
          >
            Issue
          </button>
          <button
            type="button"
            className={smButton}
            onClick={(e) => {
              e.stopPropagation();
              openOp("adjust", { materialId: inv.materialId, warehouseId: inv.warehouseId });
            }}
          >
            Adjust
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Inventory</h1>
          <p className="text-sm text-neutral-500">
            Current stock on hand per material and warehouse.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openOp("receive")}>
            Receive
          </Button>
          <Button size="sm" variant="outline" onClick={() => openOp("issue")}>
            Issue
          </Button>
          <Button size="sm" variant="outline" onClick={() => openOp("adjust")}>
            Adjust
          </Button>
          <Button size="sm" variant="outline" onClick={() => openOp("transfer")}>
            Transfer
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by material name or SKU…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            setPage(1);
          }}
          className="w-52 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
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
            empty="No stock recorded yet. Use Receive to add the first batch."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      {op.mode && (
        <StockOpModal
          key={op.key}
          mode={op.mode}
          onClose={() => setOp({ mode: null, defaults: null, key: 0 })}
          onDone={reload}
          materials={materials}
          warehouses={warehouses}
          defaults={op.defaults}
        />
      )}
    </div>
  );
}
