"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Pagination } from "@/components/admin/Pagination";
import { useList } from "@/lib/admin/useList";
import { formatDate, type Vehicle } from "@/lib/admin/types";

export default function VehiclesListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, meta, loading, error } = useList<Vehicle>("/api/admin/vehicles", {
    page: String(page),
    pageSize: "15",
    search,
  });

  const columns: Column<Vehicle>[] = [
    { key: "registrationNo", header: "Registration", render: (v) => <span className="font-medium text-neutral-700">{v.registrationNo}</span> },
    { key: "licensePlate", header: "Plate", render: (v) => v.licensePlate || "—" },
    { key: "equipment", header: "Equipment", render: (v) => v.equipment?.name || "—" },
    { key: "fuelType", header: "Fuel", render: (v) => v.fuelType || "—" },
    { key: "insuranceExpiry", header: "Insurance", render: (v) => formatDate(v.insuranceExpiry) },
    { key: "inspectionDue", header: "Inspection", render: (v) => formatDate(v.inspectionDue) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Vehicles</h1>
          <p className="text-sm text-neutral-500">On-road fleet linked to equipment records.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/vehicles/new")}
          className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Add vehicle
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search registration, plate or equipment…"
        className="w-72 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
      />

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">Loading…</div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={data}
            onRowClick={(v) => router.push(`/admin/vehicles/${v.id}`)}
            empty="No vehicles yet. Link a vehicle to an equipment record."
          />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </div>
  );
}