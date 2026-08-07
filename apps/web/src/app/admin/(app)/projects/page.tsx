"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EntityForm, type FormField } from "@/components/admin/EntityForm";
import { useList } from "@/lib/admin/useList";
import { formatDate, formatMoney, label, type Project } from "@/lib/admin/types";

const PROJECT_TYPES = ["CONSTRUCTION", "ENGINEERING", "REAL_ESTATE", "INFRASTRUCTURE", "MAINTENANCE", "LAND_DEVELOPMENT"];
const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

const CREATE_FIELDS: FormField[] = [
  { key: "name", label: "Project name", required: true },
  { key: "projectType", label: "Type", type: "select", options: PROJECT_TYPES.map((t) => ({ value: t, label: label(t) })) },
  { key: "status", label: "Status", type: "select", options: PROJECT_STATUSES.map((s) => ({ value: s, label: label(s) })) },
  { key: "location", label: "Location" },
  { key: "address", label: "Address" },
  { key: "budgetAmount", label: "Budget (GHS)", type: "number" },
  { key: "startDate", label: "Start date", type: "date" },
  { key: "endDate", label: "End date", type: "date" },
  { key: "description", label: "Description", type: "textarea" },
];

export default function ProjectsBoard() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, meta, loading, error, reload } = useList<Project>("/api/admin/projects", {
    page: String(page),
    pageSize: "15",
    status: status || undefined,
    projectType: type || undefined,
    search: search || undefined,
  });

  const columns: Column<Project>[] = [
    { key: "code", header: "Code" },
    { key: "name", header: "Project", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "projectType", header: "Type", render: (r) => <StatusBadge value={r.projectType} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "location", header: "Location" },
    { key: "budgetAmount", header: "Budget", render: (r) => formatMoney(r.budgetAmount) },
    { key: "startDate", header: "Start", render: (r) => formatDate(r.startDate) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Projects</h1>
          <p className="text-sm text-neutral-500">Construction and development projects.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          New project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, location…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
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
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All types</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading && data.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading projects…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={data}
          onRowClick={(row) => router.push(`/admin/projects/${row.id}`)}
          empty="No projects match these filters."
        />
      )}

      <Pagination meta={meta} onPage={setPage} />

      {showCreate && (
        <EntityForm
          title="New project"
          fields={CREATE_FIELDS}
          submitLabel="Create project"
          onCancel={() => setShowCreate(false)}
          onSubmit={async (values) => {
            const res = await fetch("/api/admin/projects", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: values.name,
                projectType: values.projectType || undefined,
                status: values.status || undefined,
                location: values.location || undefined,
                address: values.address || undefined,
                budgetAmount: values.budgetAmount ? Number(values.budgetAmount) : undefined,
                startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
                endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
                description: values.description || undefined,
              }),
            });
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            if (!res.ok) return { ok: false, error: body?.message ?? "Could not create project." };
            reload();
          }}
        />
      )}
    </div>
  );
}