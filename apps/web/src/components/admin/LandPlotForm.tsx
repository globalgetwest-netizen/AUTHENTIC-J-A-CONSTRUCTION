"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { label, LAND_PLOT_STATUSES, type LandPlot, type LandProject } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function LandPlotForm({
  initial = null,
  plotId = null,
  defaultProjectId = "",
}: {
  initial?: LandPlot | null;
  plotId?: string | null;
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<LandProject[]>([]);
  const [landProjectId, setLandProjectId] = useState(initial?.landProjectId ?? defaultProjectId);
  const [plotNumber, setPlotNumber] = useState(initial?.plotNumber ?? "");
  const [sizeSqm, setSizeSqm] = useState(initial ? String(Number(initial.sizeSqm) || 0) : "");
  const [pricePerSqm, setPricePerSqm] = useState(
    initial ? String(Number(initial.pricePerSqm) || 0) : "",
  );
  const [status, setStatus] = useState<string>(initial?.status ?? "AVAILABLE");
  const [coordinates, setCoordinates] = useState(initial?.coordinates ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/land-projects?pageSize=100", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: LandProject[] } | null;
        if (!cancelled) setProjects(body?.data ?? []);
      })
      .catch(() => {
        // Options list is convenience; the form still works without it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!landProjectId || !plotNumber.trim()) {
      setError("Project and plot number are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(plotId ? `/api/admin/land-plots/${plotId}` : "/api/admin/land-plots", {
        method: plotId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          landProjectId,
          plotNumber: plotNumber.trim(),
          sizeSqm: sizeSqm ? Number(sizeSqm) : null,
          pricePerSqm: pricePerSqm ? Number(pricePerSqm) : null,
          status,
          coordinates: coordinates.trim() || null,
          address: address.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save plot.");
      const id = body?.id ?? plotId;
      if (id) {
        router.push(`/admin/land-plots/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plot.");
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
          <label className={labelClass} htmlFor="plot-project">
            Project *
          </label>
          <select
            id="plot-project"
            className={inputClass}
            value={landProjectId}
            onChange={(e) => setLandProjectId(e.target.value)}
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-number">
            Plot number *
          </label>
          <input
            id="plot-number"
            className={inputClass}
            value={plotNumber}
            onChange={(e) => setPlotNumber(e.target.value)}
            placeholder="KW-01"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-status">
            Status
          </label>
          <select
            id="plot-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {LAND_PLOT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-size">
            Size (sqm)
          </label>
          <input
            id="plot-size"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={sizeSqm}
            onChange={(e) => setSizeSqm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-price">
            Price per sqm (GHS)
          </label>
          <input
            id="plot-price"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={pricePerSqm}
            onChange={(e) => setPricePerSqm(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-coord">
            Coordinates
          </label>
          <input
            id="plot-coord"
            className={inputClass}
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="plot-address">
            Address
          </label>
          <input
            id="plot-address"
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {plotId ? "Save changes" : "Create plot"}
        </Button>
        <a
          href={plotId ? `/admin/land-plots/${plotId}` : "/admin/land-plots"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
