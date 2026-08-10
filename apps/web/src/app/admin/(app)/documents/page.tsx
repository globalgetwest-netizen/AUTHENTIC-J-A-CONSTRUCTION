"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import {
  DOCUMENT_STATUSES,
  formatBytes,
  formatDate,
  label,
  type DocumentMeta,
} from "@/lib/admin/types";

const CATEGORIES = ["contracts", "plans", "reports", "safety", "permits", "financial", "other"];

export default function DocumentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<DocumentMeta>("/api/admin/documents", {
    page: String(page),
    pageSize: "15",
    status,
    category,
    search,
  });

  const columns: Column<DocumentMeta>[] = [
    {
      key: "title",
      header: "Document",
      render: (d) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-neutral-900">{d.title}</div>
          <div className="truncate text-xs text-neutral-500">
            {d.category ? label(d.category) : "Uncategorised"} · updated {formatDate(d.updatedAt)}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <StatusBadge value={d.status} />,
    },
    {
      key: "accessLevel",
      header: "Access",
      render: (d) => <StatusBadge value={d.accessLevel} />,
    },
    {
      key: "versions",
      header: "Versions",
      render: (d) => (
        <span className="text-sm text-neutral-700">v{d.versions?.length ?? d._count?.versions ?? 0}</span>
      ),
    },
    {
      key: "file",
      header: "File",
      render: (d) => (
        <span className="text-sm text-neutral-600">
          {d.sizeBytes ? formatBytes(d.sizeBytes) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Documents</h1>
          <p className="text-sm text-neutral-500">
            Centralised files — contracts, plans, reports and permits with version history.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/documents/new")}>Upload document</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by title…"
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
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
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
            onRowClick={(d) => router.push(`/admin/documents/${d.id}`)}
            empty="No documents yet. Upload your first one."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}