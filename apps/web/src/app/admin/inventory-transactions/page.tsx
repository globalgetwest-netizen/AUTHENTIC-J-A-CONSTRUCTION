"use client";

import { useEffect, useState } from "react";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  INVENTORY_TRANSACTION_TYPES,
  formatDateTime,
  type InventoryTransaction,
  type Warehouse,
} from "@/lib/admin/types";

export default function InventoryTransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const { data, meta, loading, error } = useList<InventoryTransaction>(
    "/api/admin/inventory-transactions",
    {
      page: String(page),
      pageSize: "15",
      type,
      warehouseId,
    },
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/warehouses?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: Warehouse[] } | null;
        if (!cancelled && body?.data) setWarehouses(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<InventoryTransaction>[] = [
    { key: "createdAt", header: "Date", render: (t) => formatDateTime(t.createdAt) },
    { key: "type", header: "Type", render: (t) => <StatusBadge value={t.type} /> },
    {
      key: "material",
      header: "Material",
      render: (t) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{t.material?.name || "—"}</div>
          <div className="truncate text-xs text-neutral-500">{t.material?.sku}</div>
        </div>
      ),
    },
    { key: "warehouse", header: "Warehouse", render: (t) => t.warehouse?.name || "—" },
    {
      key: "quantity",
      header: "Quantity",
      render: (t) => (
        <span className="font-medium text-neutral-700">
          {t.quantity} {t.material?.unit || ""}
        </span>
      ),
    },
    { key: "unitCost", header: "Unit cost", render: (t) => (t.unitCost != null ? `GHS ${t.unitCost}` : "—") },
    { key: "notes", header: "Notes", render: (t) => t.notes || "—" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Inventory transactions</h1>
        <p className="text-sm text-neutral-500">
          The full ledger of every stock movement (receipts, issuances, adjustments, transfers).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All types</option>
          {INVENTORY_TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
            empty="No inventory transactions yet. Stock operations will appear here."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
