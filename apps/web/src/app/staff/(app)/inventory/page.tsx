"use client";

import { WorkArea } from "@/components/staff/WorkArea";
import type { Inventory } from "@/lib/admin/types";

export default function StaffInventoryPage() {
  return (
    <WorkArea<Inventory>
      title="Inventory"
      subtitle="Current stock levels across the company's warehouses — a shared view for the stores team."
      api="/api/staff/inventory"
      searchPlaceholder="Search material or warehouse…"
      empty="No stock recorded yet. Stock operations will appear here once received."
      columns={[
        {
          key: "materialId",
          header: "Material",
          render: (i) => (
            <div className="min-w-0">
              <div className="truncate font-medium text-neutral-800">{i.material?.name ?? "—"}</div>
              <div className="text-[11px] text-neutral-400">{i.material?.sku}</div>
            </div>
          ),
        },
        { key: "warehouseId", header: "Warehouse", render: (i) => i.warehouse?.name ?? "—" },
        {
          key: "quantity",
          header: "Stock on hand",
          render: (i) => (
            <span className="font-semibold text-neutral-900">
              {String(i.quantity ?? "0")} <span className="font-normal text-neutral-500">{i.material?.unit ?? ""}</span>
            </span>
          ),
        },
        {
          key: "level",
          header: "Level",
          render: (i) => {
            const qty = Number(i.quantity ?? 0);
            const reorder = Number(i.material?.reorderLevel ?? 0);
            const low = reorder > 0 && qty <= reorder;
            return low ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Low</span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">In stock</span>
            );
          },
        },
      ]}
    />
  );
}
