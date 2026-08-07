"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { label, LAND_PLOT_STATUSES, type LandPlot } from "@/lib/admin/types";

export default function LandPlotsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<LandPlot>("/api/admin/land-plots", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<LandPlot>[] = [
    {
      key: "plotNumber",
      header: "Plot",
      render: (p) => <span className="font-medium text-neutral-900">{p.plotNumber}</span>,
    },
    {
      key: "project",
      header: "Project",
      render: (p) => p.landProject?.name || "—",
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
    {
      key: "size",
      header: "Size (sqm)",
      render: (p) => (p.sizeSqm != null ? String(p.sizeSqm) : "—"),
    },
    {
      key: "price",
      header: "Price / sqm",
      render: (p) => (p.pricePerSqm != null ? `GHS${p.pricePerSqm}` : "—"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Land plots</h1>
          <p className="text-sm text-neutral-500">
            Individual plots within land projects, tracked for allocation.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/land-plots/new")}>New plot</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by plot number or address…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All statuses</option>
          {LAND_PLOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
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
            onRowClick={(p) => router.push(`/admin/land-plots/${p.id}`)}
            empty="No plots yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
