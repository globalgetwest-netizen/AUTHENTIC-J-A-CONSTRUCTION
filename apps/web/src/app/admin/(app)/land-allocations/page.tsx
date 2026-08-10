"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatMoney, label, ALLOCATION_STATUSES, type LandAllocation } from "@/lib/admin/types";

export default function LandAllocationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<LandAllocation>("/api/admin/land-allocations", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<LandAllocation>[] = [
    {
      key: "allocationCode",
      header: "Allocation No.",
      render: (a) => <span className="font-medium text-neutral-900">{a.allocationCode}</span>,
    },
    {
      key: "project",
      header: "Project",
      render: (a) => a.landProject?.name || "—",
    },
    {
      key: "plot",
      header: "Plot",
      render: (a) => a.plot?.plotNumber || "—",
    },
    {
      key: "client",
      header: "Client",
      render: (a) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">
            {a.client?.companyName || a.client?.contactName || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (a) => <span className="font-medium text-neutral-900">{formatMoney(a.amount)}</span>,
    },
    { key: "status", header: "Status", render: (a) => <StatusBadge value={a.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Land allocations</h1>
          <p className="text-sm text-neutral-500">
            Allocation-of-land documents issued to clients for specific plots.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/land-allocations/new")}>New allocation</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by allocation no., client or plot…"
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
          {ALLOCATION_STATUSES.map((s) => (
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
            onRowClick={(a) => router.push(`/admin/land-allocations/${a.id}`)}
            empty="No allocations yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
