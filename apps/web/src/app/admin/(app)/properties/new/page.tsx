import Link from "next/link";
import { PropertyForm } from "@/components/admin/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/properties"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to properties
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New property</h1>
      <PropertyForm />
    </div>
  );
}
