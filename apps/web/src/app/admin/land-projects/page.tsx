"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";
import { label, type LandProject } from "@/lib/admin/types";

export default function LandProjectsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<LandProject>("/api/admin/land-projects", {
    page: String(page),
    pageSize: "15",
    status,
    search,
  });

  const columns: Column<LandProject>[] = [
    {
      key: "code",
      header: "Code",
      render: (p) => <span className="font-medium text-neutral-900">{p.code}</span>,
    },
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{p.name}</div>
          <div className="truncate text-xs text-neutral-500">{p.location || "—"}</div>
        </div>
      ),
    },
    {
      key: "plots",
      header: "Plots",
      render: (p) => (
        <span className="text-neutral-700">
          {p._count?.plots ?? 0} / {p.totalPlots ?? "—"}
        </span>
      ),
    },
    {
      key: "allocations",
      header: "Allocations",
      render: (p) => <span className="text-neutral-700">{p._count?.allocations ?? 0}</span>,
    },
    { key: "status", header: "Status", render: (p) => label(p.status) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Land projects</h1>
          <p className="text-sm text-neutral-500">
            Estates and developments whose plots are allocated to clients.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/land-projects/new")}>New land project</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by code, name or location…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <input
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          placeholder="Status"
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
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
            onRowClick={(p) => router.push(`/admin/land-projects/${p.id}`)}
            empty="No land projects yet. Create your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
