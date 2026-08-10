"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { BlockProductForm } from "@/components/admin/BlockProductForm";
import { formatDateTime, formatMoney, type BlockProduct } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function BlockProductDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<BlockProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/block-products/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (BlockProduct & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this product.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setProduct(record);
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
    if (!product) return;
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/block-products/${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete product.");
      return;
    }
    router.push("/admin/block-products");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/block-products"
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to block products
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Product not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/block-products"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to block products
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{product.name}</h1>
          <p className="text-sm text-neutral-500">{product.code}</p>
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
          <DetailRow label="Code">{product.code}</DetailRow>
          <DetailRow label="Unit price">{formatMoney(product.unitPrice)}</DetailRow>
          <DetailRow label="Production batches">{product._count?.productions ?? 0}</DetailRow>
          <DetailRow label="Sales">{product._count?.sales ?? 0}</DetailRow>
          <DetailRow label="Status">
            {product.isActive ? (
              <span className="text-green-700">Active</span>
            ) : (
              <span className="text-red-700">Inactive</span>
            )}
          </DetailRow>
          <DetailRow label="Description">{product.description || "—"}</DetailRow>
          <DetailRow label="Created">{formatDateTime(product.createdAt)}</DetailRow>
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit product</h2>
        <BlockProductForm initial={product} />
      </div>
    </div>
  );
}
