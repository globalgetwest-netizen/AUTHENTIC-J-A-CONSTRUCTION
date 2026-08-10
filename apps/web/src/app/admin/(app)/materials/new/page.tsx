import Link from "next/link";
import { MaterialForm } from "@/components/admin/MaterialForm";

export default function NewMaterialPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/materials"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to materials
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New material</h1>
      <MaterialForm />
    </div>
  );
}
