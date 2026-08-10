import Link from "next/link";
import { LandProjectForm } from "@/components/admin/LandProjectForm";

export default function NewLandProjectPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/land-projects"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to land projects
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New land project</h1>
      <LandProjectForm />
    </div>
  );
}
