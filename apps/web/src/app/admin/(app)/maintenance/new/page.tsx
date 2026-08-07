"use client";

import { Suspense } from "react";
import Link from "next/link";
import { MaintenanceForm } from "@/components/admin/MaintenanceForm";

export default function NewMaintenancePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/maintenance" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to maintenance
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add maintenance</h1>
        <p className="text-sm text-neutral-500">Schedule a maintenance job for an equipment record.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <Suspense fallback={null}>
          <MaintenanceForm />
        </Suspense>
      </div>
    </div>
  );
}