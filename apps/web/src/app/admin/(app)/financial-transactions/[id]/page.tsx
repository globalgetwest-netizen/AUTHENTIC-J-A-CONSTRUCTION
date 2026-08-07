"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, type FinancialTransaction } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function FinancialTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/financial-transactions/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (FinancialTransaction & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this transaction.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setTransaction(record);
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

  async function remove() {
    if (!transaction) return;
    if (!window.confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/admin/financial-transactions/${transaction.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete transaction.");
      return;
    }
    router.push("/admin/financial-transactions");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="space-y-4">
        <Link href="/admin/financial-transactions" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to financial transactions
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Transaction not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/financial-transactions" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to financial transactions
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{transaction.transactionNo}</h1>
          <p className="text-sm text-neutral-500">{transaction.category}</p>
        </div>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Status"><StatusBadge value={transaction.status} /></DetailRow>
          <DetailRow label="Type">{transaction.type}</DetailRow>
          <DetailRow label="Direction">{transaction.direction}</DetailRow>
          <DetailRow label="Amount">{formatMoney(transaction.amount)}</DetailRow>
          <DetailRow label="Category">{transaction.category}</DetailRow>
          <DetailRow label="Account">{transaction.account || "—"}</DetailRow>
          <DetailRow label="Reference">{transaction.reference || "—"}</DetailRow>
          <DetailRow label="Occurred on">{formatDate(transaction.occurredOn)}</DetailRow>
          {transaction.projectId && (
            <DetailRow label="Project">
              <Link href={`/admin/projects/${transaction.projectId}`} className="font-semibold text-brand-blue hover:underline">
                View project
              </Link>
            </DetailRow>
          )}
          {transaction.notes && <DetailRow label="Notes">{transaction.notes}</DetailRow>}
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit details</h2>
        <TransactionForm initial={transaction} />
      </div>
    </div>
  );
}