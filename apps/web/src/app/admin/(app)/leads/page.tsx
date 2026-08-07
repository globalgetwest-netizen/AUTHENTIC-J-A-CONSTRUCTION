"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EntityForm, type FormField } from "@/components/admin/EntityForm";
import { useList } from "@/lib/admin/useList";
import { formatDateTime, label, type Lead } from "@/lib/admin/types";

const LEAD_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const LEAD_SOURCES = ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "DIRECT", "EXHIBITION", "PARTNER", "OTHER"];

const CREATE_FIELDS: FormField[] = [
  { key: "name", label: "Full name", required: true },
  { key: "company", label: "Company" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "source", label: "Source", type: "select", options: LEAD_SOURCES.map((s) => ({ value: s, label: label(s) })) },
  { key: "status", label: "Status", type: "select", options: LEAD_STAGES.map((s) => ({ value: s, label: label(s) })) },
  { key: "expectedValue", label: "Expected value (GHS)", type: "number" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default function LeadsBoard() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, meta, loading, error, reload } = useList<Lead>("/api/admin/leads", {
    page: String(page),
    pageSize: "15",
    status: status || undefined,
    source: source || undefined,
    search: search || undefined,
  });

  const columns: Column<Lead>[] = [
    { key: "leadNo", header: "Lead No" },
    { key: "name", header: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "source", header: "Source", render: (r) => <StatusBadge value={r.source} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { key: "createdAt", header: "Created", render: (r) => formatDateTime(r.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Leads</h1>
          <p className="text-sm text-neutral-500">Enquiries from the website and other channels.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          New lead
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, phone…"
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
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading && data.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading leads…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={data}
          onRowClick={(row) => router.push(`/admin/leads/${row.id}`)}
          empty="No leads match these filters."
        />
      )}

      <Pagination meta={meta} onPage={setPage} />

      {showCreate && (
        <EntityForm
          title="New lead"
          fields={CREATE_FIELDS}
          submitLabel="Create lead"
          onCancel={() => setShowCreate(false)}
          onSubmit={async (values) => {
            const res = await fetch("/api/admin/leads", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: values.name,
                company: values.company || undefined,
                email: values.email || undefined,
                phone: values.phone || undefined,
                source: values.source || undefined,
                status: values.status || undefined,
                expectedValue: values.expectedValue ? Number(values.expectedValue) : undefined,
                notes: values.notes || undefined,
              }),
            });
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            if (!res.ok) return { ok: false, error: body?.message ?? "Could not create lead." };
            reload();
          }}
        />
      )}
    </div>
  );
}