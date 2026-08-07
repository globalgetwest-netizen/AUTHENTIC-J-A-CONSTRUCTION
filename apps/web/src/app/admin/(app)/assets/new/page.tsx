import Link from "next/link";
import { AssetForm } from "@/components/admin/AssetForm";

export default function NewAssetPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/assets" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to assets
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add asset</h1>
        <p className="text-sm text-neutral-500">Record a new company asset or piece of property.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <AssetForm />
      </div>
    </div>
  );
}