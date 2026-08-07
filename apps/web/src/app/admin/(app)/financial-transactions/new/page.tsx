import Link from "next/link";
import { TransactionForm } from "@/components/admin/TransactionForm";

export default function NewFinancialTransactionPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/financial-transactions" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to financial transactions
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add transaction</h1>
        <p className="text-sm text-neutral-500">Record a new income, expense, transfer or adjustment.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <TransactionForm />
      </div>
    </div>
  );
}