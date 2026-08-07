"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deductionsBreakdown,
  formatDate,
  formatMoney,
  fullName,
  type Payslip,
} from "@/lib/admin/types";

/**
 * Print-ready payslip card. Pure display — shared by the admin payslip detail
 * and the staff self-scoped payslip view. The surrounding page chrome is
 * hidden on print (`print:hidden`), so "Print / Save as PDF" yields just the
 * slip.
 */
export function PayslipView({ apiPath, backHref }: { apiPath: string; backHref: string }) {
  const [slip, setSlip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Payslip & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this payslip.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setSlip(record);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiPath]);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!slip) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Payslip not found."}
        </p>
      </div>
    );
  }

  const breakdown = deductionsBreakdown(slip.deductions);
  const employee = fullName(slip.employee);
  const staffCode = slip.employee?.employeeCode ?? "—";

  return (
    <div className="prints-only-area max-w-3xl space-y-4 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* The slip itself — this is what prints. */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
        {/* Branded header */}
        <div className="bg-blue-950 px-6 py-5 text-white">
          <div className="text-lg font-bold tracking-tight">AUTHENTIC J.A. Construction Limited</div>
          <div className="mt-0.5 text-xs text-blue-200">Employee Monthly Payslip</div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-blue-100">
            <div>Payslip: <span className="font-semibold text-white">{slip.payslipNo}</span></div>
            <div>Period: <span className="font-semibold text-white">{slip.period?.name ?? "—"}</span></div>
            <div>Issued: <span className="font-semibold text-white">{formatDate(slip.issuedAt)}</span></div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Employee block */}
          <div className="grid gap-4 border-b border-neutral-100 pb-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Employee</div>
              <div className="mt-1 text-lg font-bold">{employee}</div>
              <div className="text-sm text-neutral-500">{slip.employee?.position?.title ?? "Staff"} · {staffCode}</div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pay period</div>
              <div className="mt-1 text-base font-semibold">
                {formatDate(slip.period?.startDate)} — {formatDate(slip.period?.endDate)}
              </div>
              <div className="text-sm text-neutral-500">Department: {slip.employee?.department?.name ?? "—"}</div>
            </div>
          </div>

          <div className="grid gap-8 py-5 sm:grid-cols-2">
            {/* Earnings */}
            <div>
              <div className="mb-3 text-sm font-bold text-neutral-800">Earnings</div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-t border-neutral-100">
                    <td className="py-2 text-neutral-600">Basic salary</td>
                    <td className="py-2 text-right font-medium">{formatMoney(slip.grossPay)}</td>
                  </tr>
                  <tr className="border-t border-neutral-100">
                    <td className="py-2 text-neutral-600">Gross pay</td>
                    <td className="py-2 text-right font-semibold">{formatMoney(slip.grossPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-neutral-800">Deductions</h3>
              {breakdown && breakdown.lines.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {breakdown.lines.map((line, i) => (
                      <tr key={`${line.name}-${i}`} className="border-t border-neutral-100">
                        <td className="py-2 text-neutral-600">{line.name}</td>
                        <td className="py-2 text-right">− {formatMoney(line.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-neutral-200">
                      <td className="py-2 font-semibold text-neutral-800">Total deductions</td>
                      <td className="py-2 text-right font-semibold">− {formatMoney(breakdown.total)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-neutral-500">No deductions.</p>
              )}
            </div>
          </div>

          {/* Net pay */}
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-neutral-700">Net pay</div>
              <div className="text-xs text-neutral-500">After statutory deductions</div>
            </div>
            <div className="text-2xl font-bold text-brand-blue">{formatMoney(slip.netPay)}</div>
          </div>

          {/* Employer contributions (informational) */}
          {breakdown?.employer && (Number(breakdown.employer.ssnit) > 0 || Number(breakdown.employer.nhil) > 0) && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Employer contributions (not deducted from pay): SSNIT employer{" "}
              <span className="font-semibold">{formatMoney(breakdown.employer.ssnit)}</span> · NHIL{" "}
              <span className="font-semibold">{formatMoney(breakdown.employer.nhil)}</span>
            </div>
          )}

          <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-500">
            <span>Please contact HR for any queries on this slip.</span>
            <span>Issued {formatDate(slip.issuedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}