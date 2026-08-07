"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { ReceiptForm } from "@/components/admin/ReceiptForm";
import { formatDate, formatMoney, type Receipt } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/receipts/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Receipt & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this receipt.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setReceipt(record);
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
    if (!receipt) return;
    if (!window.confirm("Delete this receipt record?")) return;
    const res = await fetch(`/api/admin/receipts/${receipt.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete receipt.");
      return;
    }
    router.push("/admin/receipts");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="space-y-4">
        <Link href="/admin/receipts" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to receipts
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Receipt not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/receipts" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to receipts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{receipt.receiptNo}</h1>
          <p className="text-sm text-neutral-500">{formatDate(receipt.receivedOn)}</p>
        </div>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Client">{receipt.client?.companyName || receipt.client?.contactName || "—"}</DetailRow>
          <DetailRow label="Amount">{formatMoney(receipt.amount)}</DetailRow>
          <DetailRow label="Received on">{formatDate(receipt.receivedOn)}</DetailRow>
          <DetailRow label="Method">{receipt.method}</DetailRow>
          {receipt.invoice && (
            <DetailRow label="Invoice">{receipt.invoice.invoiceNo}</DetailRow>
          )}
          {receipt.reference && <DetailRow label="Reference">{receipt.reference}</DetailRow>}
          {receipt.notes && <DetailRow label="Notes">{receipt.notes}</DetailRow>}
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit details</h2>
        <ReceiptForm initial={receipt} />
      </div>
    </div>
  );
}