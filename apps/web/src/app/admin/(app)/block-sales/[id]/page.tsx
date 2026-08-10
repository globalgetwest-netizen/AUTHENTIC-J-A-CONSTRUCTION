"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { BlockSaleForm } from "@/components/admin/BlockSaleForm";
import { formatDate, formatMoney, type BlockSale } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function BlockSaleDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<BlockSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/block-sales/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (BlockSale & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this sale.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setSale(record);
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
    if (!sale) return;
    if (!window.confirm("Delete this sale? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/block-sales/${sale.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete sale.");
      return;
    }
    router.push("/admin/block-sales");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/block-sales"
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to block sales
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Sale not found."}
        </p>
      </div>
    );
  }

  const clientName = sale.client?.companyName || sale.client?.contactName;

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/block-sales"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to block sales
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{sale.reference || "Block sale"}</h1>
          <p className="text-sm text-neutral-500">{sale.product?.name || "No product"}</p>
        </div>
        <Button variant="danger" onClick={remove}>
          Delete
        </Button>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Product">{sale.product?.name || "—"}</DetailRow>
          <DetailRow label="Client">{clientName || "Cash / walk-in sale"}</DetailRow>
          <DetailRow label="Quantity">
            <span className="font-medium">{sale.quantity} blocks</span>
          </DetailRow>
          <DetailRow label="Unit price">{formatMoney(sale.unitPrice)}</DetailRow>
          <DetailRow label="Total amount">
            <span className="font-semibold text-neutral-900">{formatMoney(sale.totalAmount)}</span>
          </DetailRow>
          <DetailRow label="Sold on">{formatDate(sale.soldOn)}</DetailRow>
          <DetailRow label="Reference">{sale.reference || "—"}</DetailRow>
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit sale</h2>
        <BlockSaleForm initial={sale} />
      </div>
    </div>
  );
}
