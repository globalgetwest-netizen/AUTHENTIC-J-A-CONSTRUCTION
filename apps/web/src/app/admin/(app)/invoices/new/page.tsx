import Link from "next/link";
import { InvoiceForm } from "@/components/admin/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/invoices" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to invoices
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">New invoice</h1>
        <p className="text-sm text-neutral-500">Raise a bill to a client, with line items.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <InvoiceForm />
      </div>
    </div>
  );
}