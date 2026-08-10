import Link from "next/link";
import { LandPlotForm } from "@/components/admin/LandPlotForm";

export default function NewLandPlotPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/land-plots"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to land plots
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New plot</h1>
      <LandPlotForm />
    </div>
  );
}
