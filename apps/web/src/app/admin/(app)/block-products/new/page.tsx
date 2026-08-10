import Link from "next/link";
import { BlockProductForm } from "@/components/admin/BlockProductForm";

export default function NewBlockProductPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/block-products"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to block products
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New block product</h1>
      <BlockProductForm />
    </div>
  );
}
