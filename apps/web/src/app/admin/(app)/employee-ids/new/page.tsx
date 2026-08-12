import Link from "next/link";
import { EmployeeIdIssueForm } from "@/components/admin/EmployeeIdIssueForm";

export default function NewEmployeeIdPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/employee-ids"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to employee IDs
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Issue ID card</h1>
        <p className="text-sm text-neutral-500">
          Choose the ID category (CEO, Admin, Staff or Worker), add the holder and a photo, preview it,
          then generate a branded card with a QR code for guard-side verification.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <EmployeeIdIssueForm />
      </div>
    </div>
  );
}