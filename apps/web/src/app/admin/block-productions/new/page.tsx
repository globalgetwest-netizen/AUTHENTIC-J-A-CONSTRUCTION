import Link from "next/link";
import { BlockProductionForm } from "@/components/admin/BlockProductionForm";

export default function NewBlockProductionPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/block-productions"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to block production
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New production batch</h1>
      <BlockProductionForm />
    </div>
  );
}
