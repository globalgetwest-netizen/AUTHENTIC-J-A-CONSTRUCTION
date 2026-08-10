import Link from "next/link";
import { WarehouseForm } from "@/components/admin/WarehouseForm";

export default function NewWarehousePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/warehouses"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to warehouses
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New warehouse</h1>
      <WarehouseForm />
    </div>
  );
}
