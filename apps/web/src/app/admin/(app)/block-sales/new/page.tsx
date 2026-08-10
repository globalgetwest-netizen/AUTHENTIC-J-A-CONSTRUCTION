import Link from "next/link";
import { BlockSaleForm } from "@/components/admin/BlockSaleForm";

export default function NewBlockSalePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/block-sales"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to block sales
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New block sale</h1>
      <BlockSaleForm />
    </div>
  );
}
