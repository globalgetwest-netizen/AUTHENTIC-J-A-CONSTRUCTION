"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  ALLOCATION_STATUSES,
  label,
  type Client,
  type LandAllocation,
  type LandPlot,
  type LandProject,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function toDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function LandAllocationForm({
  initial = null,
  allocationId = null,
  defaultProjectId = "",
}: {
  initial?: LandAllocation | null;
  allocationId?: string | null;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<LandProject[]>([]);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [landProjectId, setLandProjectId] = useState(initial?.landProjectId ?? defaultProjectId);
  const [plotId, setPlotId] = useState(initial?.plotId ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [amount, setAmount] = useState(initial ? String(Number(initial.amount) || 0) : "");
  const [status, setStatus] = useState<string>(initial?.status ?? "PENDING");
  const [allocatedAt, setAllocatedAt] = useState(toDate(initial?.allocatedAt));
  const [signedAt, setSignedAt] = useState(toDate(initial?.signedAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/land-projects?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/clients?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([pr, cr]) => {
        const pj = (await pr.json().catch(() => null)) as { data?: LandProject[] } | null;
        const cj = (await cr.json().catch(() => null)) as { data?: Client[] } | null;
        if (!cancelled) {
          setProjects(pj?.data ?? []);
          setClients(cj?.data ?? []);
        }
      })
      .catch(() => {
        // Options lists are convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load plots for the selected project so the plot select is scoped.
  // When no project is selected the plot list is cleared by the select's
  // onChange (never synchronously here), so no fetch runs.
  useEffect(() => {
    if (!landProjectId) return;
    let cancelled = false;
    fetch(`/api/admin/land-plots?pageSize=100&landProjectId=${landProjectId}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: LandPlot[] } | null;
        if (!cancelled) setPlots(body?.data ?? []);
      })
      .catch(() => {
        // Options list is convenience; the form still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, [landProjectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!landProjectId || !plotId || !clientId) {
      setError("Project, plot and client are required.");
      return;
    }
    if (!amount) {
      setError("An amount is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        allocationId
          ? `/api/admin/land-allocations/${allocationId}`
          : "/api/admin/land-allocations",
        {
          method: allocationId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            landProjectId,
            plotId,
            clientId,
            amount: Number(amount),
            status,
            allocatedAt: allocatedAt
              ? new Date(`${allocatedAt}T00:00:00`).toISOString()
              : undefined,
            signedAt: signedAt ? new Date(`${signedAt}T00:00:00`).toISOString() : null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save allocation.");
      const id = body?.id ?? allocationId;
      if (id) {
        router.push(`/admin/land-allocations/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save allocation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="alloc-project">
            Project *
          </label>
          <select
            id="alloc-project"
            className={inputClass}
            value={landProjectId}
            onChange={(e) => {
              setLandProjectId(e.target.value);
              setPlotId("");
              setPlots([]);
            }}
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="alloc-plot">
            Plot *
          </label>
          <select
            id="alloc-plot"
            className={inputClass}
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
          >
            <option value="">{landProjectId ? "Select a plot…" : "Pick a project first…"}</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plotNumber} ({label(p.status)})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="alloc-client">
            Client *
          </label>
          <select
            id="alloc-client"
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.contactName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="alloc-amount">
            Amount (GHS) *
          </label>
          <input
            id="alloc-amount"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="alloc-status">
            Status
          </label>
          <select
            id="alloc-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ALLOCATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="alloc-date">
            Allocated date
          </label>
          <input
            id="alloc-date"
            type="date"
            className={inputClass}
            value={allocatedAt}
            onChange={(e) => setAllocatedAt(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="alloc-signed">
            Signed date
          </label>
          <input
            id="alloc-signed"
            type="date"
            className={inputClass}
            value={signedAt}
            onChange={(e) => setSignedAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {allocationId ? "Save changes" : "Create allocation"}
        </Button>
        <a
          href={allocationId ? `/admin/land-allocations/${allocationId}` : "/admin/land-allocations"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
