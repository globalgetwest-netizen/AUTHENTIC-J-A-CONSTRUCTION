import Link from "next/link";
import { PaymentForm } from "@/components/admin/PaymentForm";

export default function NewPaymentPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/payments" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to payments
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add payment</h1>
        <p className="text-sm text-neutral-500">Record a payout to an employee, supplier, client or contractor.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <PaymentForm />
      </div>
    </div>
  );
}