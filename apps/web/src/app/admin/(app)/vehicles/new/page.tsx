"use client";

import { Suspense } from "react";
import Link from "next/link";
import { VehicleForm } from "@/components/admin/VehicleForm";

export default function NewVehiclePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/vehicles" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to vehicles
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Add vehicle</h1>
        <p className="text-sm text-neutral-500">Link a road vehicle to an equipment record.</p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <Suspense fallback={null}>
          <VehicleForm />
        </Suspense>
      </div>
    </div>
  );
}