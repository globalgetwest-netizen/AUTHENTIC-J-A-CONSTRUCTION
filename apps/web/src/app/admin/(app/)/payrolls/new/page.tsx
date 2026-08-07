"use client";

import Link from "next/link";
import { PayrollPeriodForm } from "@/components/admin/PayrollPeriodForm";

export default function NewPayrollPeriodPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/payrolls" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to pay periods
      </Link>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">New pay period</h1>
        <p className="text-sm text-neutral-500">
          Define the month and date range for a payroll cycle.
        </p>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <PayrollPeriodForm />
      </div>
    </div>
  );
}