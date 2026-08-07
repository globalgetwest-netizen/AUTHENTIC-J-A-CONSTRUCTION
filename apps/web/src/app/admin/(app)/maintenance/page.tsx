"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ajac/ui";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useList } from "@/lib/admin/useList";
import { formatDate, formatMoney, type Equipment, type MaintenanceRecord } from "@/lib/admin/types";

export default function MaintenanceListPage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceList />
    </Suspense>
  );
}

function MaintenanceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [equipmentId, setEquipmentId] = useState(searchParams.get("equipmentId") ?? "");
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/equipment?pageSize=100", { cache: "no-store" })
      .then(async (res) => res.json().catch(() => null))
      .then((body) => {
        if (!cancelled && body?.data) setEquipments(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, meta, loading, error } = useList<MaintenanceRecord>("/api/admin/maintenance", {
    page: String(page),
    pageSize: "15",
    search,
    status,
    equipmentId,
  });

  const columns: Column<MaintenanceRecord>[] = [
    { key: "equipment", header: "Equipment", render: (m) => <span className="font-medium text-neutral-700">{m.equipment?.name || "—"}</span> },
    { key: "scheduledAt", header: "Scheduled", render: (m) => formatDate(m.scheduledAt) },
    { key: "cost", header: "Cost", render: (m) => formatMoney(m.cost) },
    { key: "serviceProvider", header: "Provider", render: (m) => m.serviceProvider || "—" },
    { key: "status", header: "Status", render: (m) => <StatusBadge value={m.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Maintenance</h1>
          <p className="text-sm text-neutral-500">Scheduled and completed equipment maintenance jobs.</p>
        </div>
        <Button onClick={() => router.push("/admin/maintenance/new")}>Add maintenance</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search description or provider…"
          className="w-64 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        />
        <select
          value={equipmentId}
          onChange={(e) => { setEquipmentId(e.target.value); setPage(1); }}
          className="w-52 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any equipment</option>
          {equipments.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name} ({eq.assetCode})</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Any status</option>
          {["SCHEDULED", "IN_PROGRESS", "COMPLETED", "DEFERRED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{s}</option>
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
            onRowClick={(m) => router.push(`/admin/maintenance/${m.id}`)}
            empty="No maintenance jobs yet. Schedule your first service."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}