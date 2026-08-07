import Link from "next/link";
import { ExpenseForm } from "@/components/admin/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/expenses" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to expenses
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add expense</h1>
        <p className="text-sm text-neutral-500">Record a company expense or project spend.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <ExpenseForm />
      </div>
    </div>
  );
}