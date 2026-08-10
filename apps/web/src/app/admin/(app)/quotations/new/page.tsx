import Link from "next/link";
import { QuotationForm } from "@/components/admin/QuotationForm";

export default function NewQuotationPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/quotations"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to quotations
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New quotation</h1>
      <QuotationForm />
    </div>
  );
}