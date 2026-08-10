"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatDate, type BlockProduct, type BlockProduction } from "@/lib/admin/types";

export default function BlockProductionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<BlockProduct[]>([]);

  const { data, meta, loading, error } = useList<BlockProduction>("/api/admin/block-productions", {
    page: String(page),
    pageSize: "15",
    productId,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/block-products?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: BlockProduct[] } | null;
        if (!cancelled && body?.data) setProducts(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const columns: Column<BlockProduction>[] = [
    { key: "batchNo", header: "Batch", render: (p) => <span className="font-medium text-neutral-900">{p.batchNo}</span> },
    { key: "product", header: "Product", render: (p) => p.product?.name || "—" },
    {
      key: "quantity",
      header: "Quantity",
      render: (p) => <span className="font-medium text-neutral-700">{p.quantity}</span>,
    },
    { key: "producedOn", header: "Produced on", render: (p) => formatDate(p.producedOn) },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    { key: "notes", header: "Notes", render: (p) => p.notes || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Block production</h1>
          <p className="text-sm text-neutral-500">
            Batches of blocks manufactured at the factory.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/block-productions/new")}>New production</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setPage(1);
          }}
          className="w-56 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading…
        </div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={data}
            onRowClick={(p) => router.push(`/admin/block-productions/${p.id}`)}
            empty="No production batches yet. Record your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
