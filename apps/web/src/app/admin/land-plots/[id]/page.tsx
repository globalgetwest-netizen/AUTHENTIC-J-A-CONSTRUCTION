"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { LandPlotForm } from "@/components/admin/LandPlotForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { label, LAND_PLOT_STATUSES, type LandPlot } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function LandPlotDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [plot, setPlot] = useState<LandPlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/land-plots/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (LandPlot & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this plot.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setPlot(record);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!plot || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/land-plots/${plot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setPlot({ ...plot, status: next as LandPlot["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!plot) return;
    if (!window.confirm("Delete this plot? This cannot be undone.")) return;
    await fetch(`/api/admin/land-plots/${plot.id}`, { method: "DELETE" });
    router.push("/admin/land-plots");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !plot) {
    return (
      <div>
        <Link href="/admin/land-plots" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to land plots
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Plot not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit plot {plot.plotNumber}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <LandPlotForm initial={plot} plotId={plot.id} defaultProjectId={plot.landProjectId} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/land-plots" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to land plots
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">Plot {plot.plotNumber}</h1>
          <StatusBadge value={plot.status} />
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Project">
            {plot.landProject?.name || "—"}
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={plot.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {LAND_PLOT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Size (sqm)">{plot.sizeSqm != null ? String(plot.sizeSqm) : "—"}</DetailRow>
          <DetailRow label="Price / sqm">
            {plot.pricePerSqm != null ? `GHS${plot.pricePerSqm}` : "—"}
          </DetailRow>
          <DetailRow label="Coordinates">{plot.coordinates || "—"}</DetailRow>
          <DetailRow label="Address">{plot.address || "—"}</DetailRow>
        </dl>
      </div>

      {message && (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={remove}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Delete plot
      </button>
    </div>
  );
}
