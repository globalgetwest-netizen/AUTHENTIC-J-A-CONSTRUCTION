"use client";

import Link from "next/link";
import { EmployeeForm } from "@/components/admin/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/employees"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to employees
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">New employee</h1>
      <EmployeeForm />
    </div>
  );
}
