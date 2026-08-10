"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { MaterialForm } from "@/components/admin/MaterialForm";
import { formatDateTime, formatMoney, type Material } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/materials/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Material & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this material.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setMaterial(record);
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
    if (!material) return;
    if (!window.confirm(`Delete ${material.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/materials/${material.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete material.");
      return;
    }
    router.push("/admin/materials");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!material) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/materials"
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to materials
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Material not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href="/admin/materials"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to materials
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{material.name}</h1>
          <p className="text-sm text-neutral-500">
            {material.sku} · {material.category?.name || "No category"}
          </p>
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
          <DetailRow label="SKU">{material.sku}</DetailRow>
          <DetailRow label="Unit">{material.unit}</DetailRow>
          <DetailRow label="Category">{material.category?.name || "—"}</DetailRow>
          <DetailRow label="Stock on hand">
            <span className="font-medium">
              {material.currentStock} {material.unit}
            </span>
          </DetailRow>
          <DetailRow label="Reorder level">
            {material.reorderLevel != null ? `${material.reorderLevel} ${material.unit}` : "—"}
          </DetailRow>
          <DetailRow label="Cost per unit">{formatMoney(material.costPerUnit)}</DetailRow>
          <DetailRow label="Status">
            {material.isActive ? (
              <span className="text-green-700">Active</span>
            ) : (
              <span className="text-red-700">Inactive</span>
            )}
          </DetailRow>
          <DetailRow label="Description">{material.description || "—"}</DetailRow>
          <DetailRow label="Created">{formatDateTime(material.createdAt)}</DetailRow>
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900">
          Stock by warehouse
        </div>
        {!material.inventory || material.inventory.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-neutral-500">
            No stock recorded yet — add stock from the inventory board.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3">Warehouse</th>
                <th className="px-5 py-3">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {material.inventory.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-5 py-3 text-neutral-900">{inv.warehouse?.name || "—"}</td>
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {inv.quantity} {material.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Edit material</h2>
        <MaterialForm initial={material} />
      </div>
    </div>
  );
}
