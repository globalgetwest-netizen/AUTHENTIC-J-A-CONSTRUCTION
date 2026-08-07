"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney, type Payslip } from "@/lib/admin/types";

export default function StaffPayslipsListPage() {
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/payslips", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (Payslip[] & { message?: string })
          | Payslip[]
          | { message?: string }
          | null;
        if (!res.ok || !Array.isArray(body)) {
          const msg = (body as { message?: string } | null)?.message ?? "Could not load your payslips.";
          throw new Error(msg);
        }
        return body as Payslip[];
      })
      .then((list) => {
        if (!cancelled) {
          setSlips(list);
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
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My payslips</h1>
        <p className="text-sm text-neutral-500">
          Payslips issued for each payroll period you were included in.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading…
        </div>
      ) : slips.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          No payslips have been issued to you yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {slips.map((s) => (
            <Link
              key={s.id}
              href={`/staff/payslips/${s.id}`}
              className="group rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-brand-blue hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">{s.period?.name ?? "—"}</span>
                <span className="text-lg font-bold text-brand-blue">{formatMoney(s.netPay)}</span>
              </div>
              <div className="mt-1 text-sm text-neutral-500">Net pay</div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                <span>Issued {formatDate(s.issuedAt)}</span>
                <span className="font-semibold text-brand-blue group-hover:underline">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}