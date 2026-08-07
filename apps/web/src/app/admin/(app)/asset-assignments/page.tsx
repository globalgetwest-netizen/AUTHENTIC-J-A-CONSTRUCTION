"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatDate, type AssetAssignment } from "@/lib/admin/types";

export default function AssetAssignmentsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("");

  const { data, meta, loading, error } = useList<AssetAssignment>("/api/admin/asset-assignments", {
    page: String(page),
    pageSize: "15",
    search,
    ...(scope === "active" ? { activeOnly: "true" } : {}),
  });

  const columns: Column<AssetAssignment>[] = [
    {
      key: "asset",
      header: "Asset",
      render: (a) => (
        <div>
          <p className="font-medium text-neutral-700">{a.asset?.name || "—"}</p>
          <p className="text-xs text-neutral-400">{a.asset?.assetCode}</p>
        </div>
      ),
    },
    { key: "assignedAt", header: "Assigned", render: (a) => formatDate(a.assignedAt) },
    {
      key: "returnedAt",
      header: "Returned",
      render: (a) =>
        a.returnedAt ? (
          formatDate(a.returnedAt)
        ) : (
          <StatusBadge value="Active" />
        ),
    },
    { key: "notes", header: "Notes", render: (a) => a.notes || "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Asset assignments</h1>
          <p className="text-sm text-neutral-500">
            Which company asset has been issued to which employee.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/asset-assignments/new")}>
          New assignment
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search asset, code or notes…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setPage(1);
          }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All assignments</option>
          <option value="active">Active only</option>
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
            onRowClick={(a) => router.push(`/admin/asset-assignments/${a.id}`)}
            empty="No assignments yet. Issue an asset to a staff member."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}