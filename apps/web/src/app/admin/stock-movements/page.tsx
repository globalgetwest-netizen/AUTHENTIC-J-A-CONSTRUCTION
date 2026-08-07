"use client";

import { useEffect, useState } from "react";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";
import { formatDateTime, type StockMovement, type Warehouse } from "@/lib/admin/types";

export default function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const { data, meta, loading, error } = useList<StockMovement>("/api/admin/stock-movements", {
    page: String(page),
    pageSize: "15",
    warehouseId,
  });

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

  const columns: Column<StockMovement>[] = [
    { key: "movedAt", header: "Moved at", render: (m) => formatDateTime(m.movedAt) },
    {
      key: "material",
      header: "Material",
      render: (m) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{m.inventory?.material?.name || "—"}</div>
          <div className="truncate text-xs text-neutral-500">{m.inventory?.material?.sku}</div>
        </div>
      ),
    },
    { key: "from", header: "From", render: (m) => m.fromWarehouse?.name || "—" },
    { key: "to", header: "To", render: (m) => m.toWarehouse?.name || "—" },
    {
      key: "quantity",
      header: "Quantity",
      render: (m) => (
        <span className="font-medium text-neutral-700">
          {m.quantity} {m.inventory?.material?.unit || ""}
        </span>
      ),
    },
    { key: "notes", header: "Notes", render: (m) => m.notes || "—" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Stock movements</h1>
        <p className="text-sm text-neutral-500">
          Audit trail of inter-warehouse transfers.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
            empty="No transfers yet. Stock transfers will appear here."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
