"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { PayrollPeriodForm } from "@/components/admin/PayrollPeriodForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  formatMoney,
  fullName,
  type PayrollPeriod,
  type PayrollRun,
} from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

type ActionName = "generate" | "process" | "issue";

export default function PayrollPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<ActionName | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/payroll-periods/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (PayrollPeriod & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this pay period.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setPeriod(record);
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
  }, [id]);

  async function runAction(action: ActionName) {
    if (!period) return;
    setBusy(action);
    setMessage("");
    const endpoints: Record<ActionName, string> = {
      generate: `generate`,
      process: `process`,
      issue: `issue-payslips`,
    };
    try {
      const res = await fetch(`/api/admin/payroll-periods/${period.id}/${endpoints[action]}`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as
        | { message?: string; created?: number }
        | null;
      if (!res.ok) throw new Error(body?.message ?? "Action failed.");
      const note =
        action === "generate"
          ? `Generated ${body?.created ?? 0} payroll run.`
          : action === "process"
            ? "Payroll processed."
            : "Payslips issued.";
      setMessage(note);
      // Reload the period to pick up new status / runs.
      const fresh = await fetch(`/api/admin/payroll-periods/${period.id}`, { cache: "no-store" });
      const freshBody = (await fresh.json().catch(() => null)) as PayrollPeriod | null;
      if (fresh.ok && freshBody?.id) setPeriod(freshBody);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!period) {
    return (
      <div className="space-y-4">
        <Link href="/admin/payrolls" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to pay periods
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Pay period not found."}
        </p>
      </div>
    );
  }

  const runs = period.payrolls ?? [];
  const slips = period.payslips ?? [];
  const grossTotal = runs.reduce((sum, r) => sum + Number(r.grossPay), 0);
  const netTotal = runs.reduce((sum, r) => sum + Number(r.netPay), 0);
  const canGenerate = period.status === "DRAFT";
  const canProcess = runs.length > 0 && period.status === "DRAFT";
  const canIssue = runs.length > 0 && period.status === "PROCESSED";

  const runColumns: Column<PayrollRun>[] = [
    { key: "employeeId", header: "Employee", render: (r) => <span className="font-medium text-neutral-700">{fullName(r.employee)}</span> },
    { key: "grossPay", header: "Gross", render: (r) => formatMoney(r.grossPay) },
    { key: "netPay", header: "Net", render: (r) => formatMoney(r.netPay) },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={r.status} />,
    },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/payrolls" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to pay periods
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{period.name}</h1>
          <p className="text-sm text-neutral-500">
            {formatDate(period.startDate)} — {formatDate(period.endDate)}
          </p>
        </div>
        <StatusBadge value={period.status} />
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      {/* Workflow actions */}
      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Payroll workflow</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            loading={busy === "generate"}
            disabled={!canGenerate}
            onClick={() => runAction("generate")}
          >
            Generate runs
          </Button>
          <Button
            variant="outline"
            loading={busy === "process"}
            disabled={!canProcess}
            onClick={() => runAction("process")}
          >
            Process payrun
          </Button>
          <Button
            loading={busy === "issue"}
            disabled={!canIssue}
            onClick={() => runAction("issue")}
          >
            Issue payslips
          </Button>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Generate turns ACTIVE salaried employees into payroll runs. Process locks the
          amounts and timestamps the payrun. Issue payslips creates a printable slip per run.
          {!canGenerate && period.status !== "PAID" && !canIssue && (
            <span className="text-blue-700"> Payroll performed — next step {period.status === "DRAFT" ? "is Process" : "is Issue payslips"}.</span>
          )}
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Status"><StatusBadge value={period.status} /></DetailRow>
          <DetailRow label="Period">{formatDate(period.startDate)} → {formatDate(period.endDate)}</DetailRow>
          <DetailRow label="Payroll runs">{runs.length}</DetailRow>
          <DetailRow label="Payslips issued">{slips.length}</DetailRow>
          <DetailRow label="Gross total">{formatMoney(grossTotal)}</DetailRow>
          <DetailRow label="Net total">{formatMoney(netTotal)}</DetailRow>
          {period.closedAt && (
            <DetailRow label="Closed on">{formatDate(period.closedAt)}</DetailRow>
          )}
        </dl>
      </div>

      {/* Runs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Payroll runs</h2>
          {slips.length > 0 && (
            <Link
              href={`/admin/payslips?periodId=${period.id}`}
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              View {slips.length} payslip{slips.length === 1 ? "" : "s"} →
            </Link>
          )}
        </div>
        {runs.length === 0 ? (
          <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
            No runs yet. Click <b>Generate runs</b> to create them from active salaried employees.
          </p>
        ) : (
          <AdminTable
            columns={runColumns}
            rows={runs}
            onRowClick={(r) => router.push(`/admin/payrolls/${period.id}/runs/${r.id}`)}
            empty="No payroll runs."
          />
        )}
      </div>

      {/* Edit (only while DRAFT) */}
      {canGenerate && (
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit period</h2>
          <PayrollPeriodForm initial={period} />
        </div>
      )}
    </div>
  );
}