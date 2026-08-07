import Link from "next/link";
import { ReceiptForm } from "@/components/admin/ReceiptForm";

export default function NewReceiptPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/receipts" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to receipts
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add receipt</h1>
        <p className="text-sm text-neutral-500">Record a payment received from a client.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <ReceiptForm />
      </div>
    </div>
  );
}