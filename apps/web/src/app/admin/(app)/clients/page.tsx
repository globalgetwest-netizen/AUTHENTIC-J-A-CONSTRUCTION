"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EntityForm, type FormField } from "@/components/admin/EntityForm";
import { useList } from "@/lib/admin/useList";
import { label, type Client } from "@/lib/admin/types";

const CLIENT_TYPES = ["INDIVIDUAL", "CORPORATE"];
const CLIENT_STATUSES = ["ACTIVE", "INACTIVE", "BLACKLISTED"];

const CREATE_FIELDS: FormField[] = [
  { key: "contactName", label: "Contact name", required: true },
  { key: "type", label: "Type", type: "select", options: CLIENT_TYPES.map((t) => ({ value: t, label: label(t) })) },
  { key: "companyName", label: "Company name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status", type: "select", options: CLIENT_STATUSES.map((s) => ({ value: s, label: label(s) })) },
];

export default function ClientsBoard() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, meta, loading, error, reload } = useList<Client>("/api/admin/clients", {
    page: String(page),
    pageSize: "15",
    status: status || undefined,
    type: type || undefined,
    search: search || undefined,
  });

  const columns: Column<Client>[] = [
    { key: "clientCode", header: "Code" },
    { key: "contactName", header: "Contact", render: (r) => <span className="font-semibold">{r.contactName}</span> },
    { key: "type", header: "Type", render: (r) => <StatusBadge value={r.type} /> },
    { key: "companyName", header: "Company" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Clients</h1>
          <p className="text-sm text-neutral-500">Customers, buyers, tenants and partners.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          New client
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, company, email…"
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
          {CLIENT_STATUSES.map((s) => (
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
          {CLIENT_TYPES.map((t) => (
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
          Loading clients…
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={data}
          onRowClick={(row) => router.push(`/admin/clients/${row.id}`)}
          empty="No clients match these filters."
        />
      )}

      <Pagination meta={meta} onPage={setPage} />

      {showCreate && (
        <EntityForm
          title="New client"
          fields={CREATE_FIELDS}
          submitLabel="Create client"
          onCancel={() => setShowCreate(false)}
          onSubmit={async (values) => {
            const res = await fetch("/api/admin/clients", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                contactName: values.contactName,
                type: values.type || undefined,
                companyName: values.companyName || undefined,
                email: values.email || undefined,
                phone: values.phone || undefined,
                address: values.address || undefined,
                status: values.status || undefined,
              }),
            });
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            if (!res.ok) return { ok: false, error: body?.message ?? "Could not create client." };
            reload();
          }}
        />
      )}
    </div>
  );
}