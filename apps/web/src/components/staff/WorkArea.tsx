"use client";

import { useState, type ReactNode } from "react";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";

/**
 * Shared frame for a staff department-work page: header, optional create form,
 * a search box, and the paginated list table. The create form is provided by
 * the page as a render prop that receives `onCreated` to refresh the list.
 */
export function WorkArea<T extends { id: string }>({
  title,
  subtitle,
  api,
  columns,
  empty = "No records yet.",
  searchPlaceholder = "Search…",
  pageSize = 15,
  form,
  action,
}: {
  title: string;
  subtitle: string;
  /** The staff proxy path, e.g. "/api/staff/expenses". */
  api: string;
  columns: Column<T>[];
  empty?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Optional create form card; `onCreated` refreshes the list underneath. */
  form?: (onCreated: () => void) => ReactNode;
  /** Optional trailing action column (e.g. Approve a PENDING expense). */
  action?: { header: string; render: (row: T, reload: () => void) => ReactNode };
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, meta, loading, error, reload } = useList<T>(api, {
    page: String(page),
    pageSize: String(pageSize),
    search,
  });

  const columnsWithAction = action
    ? [
        ...columns,
        {
          key: "__action",
          header: action.header,
          render: (row: T) => action.render(row, reload),
        } satisfies Column<T>,
      ]
    : columns;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">{subtitle}</p>
      </div>

      {form ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          {form(reload)}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
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
          <AdminTable columns={columnsWithAction} rows={data} empty={empty} />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}
