import Link from "next/link";
import { PropertySaleForm } from "@/components/admin/PropertySaleForm";

export default function NewPropertySalePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/property-sales"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to property sales
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New property sale</h1>
      <PropertySaleForm />
    </div>
  );
}
