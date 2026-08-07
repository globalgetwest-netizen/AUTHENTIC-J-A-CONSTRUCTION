import Link from "next/link";
import { EquipmentForm } from "@/components/admin/EquipmentForm";

export default function NewEquipmentPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/equipment" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to equipment
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add equipment</h1>
        <p className="text-sm text-neutral-500">Record a new machine, plant or heavy asset.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <EquipmentForm />
      </div>
    </div>
  );
}