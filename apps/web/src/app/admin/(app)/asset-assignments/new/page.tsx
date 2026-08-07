import Link from "next/link";
import { AssetAssignmentForm } from "@/components/admin/AssetAssignmentForm";

export default function NewAssetAssignmentPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/asset-assignments"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to asset assignments
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">New asset assignment</h1>
        <p className="text-sm text-neutral-500">Issue a company asset to a staff member.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <AssetAssignmentForm />
      </div>
    </div>
  );
}