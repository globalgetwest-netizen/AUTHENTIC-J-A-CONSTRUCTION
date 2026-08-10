import Link from "next/link";
import { LandAllocationForm } from "@/components/admin/LandAllocationForm";

export default function NewLandAllocationPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/land-allocations"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to land allocations
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New allocation</h1>
      <LandAllocationForm />
    </div>
  );
}
