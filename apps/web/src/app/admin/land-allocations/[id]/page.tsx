"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { LandAllocationForm } from "@/components/admin/LandAllocationForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatMoney, label, ALLOCATION_STATUSES, type LandAllocation } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function LandAllocationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [allocation, setAllocation] = useState<LandAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/land-allocations/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (LandAllocation & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this allocation.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setAllocation(record);
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
    if (!allocation || !next) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/land-allocations/${allocation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setAllocation({ ...allocation, status: next as LandAllocation["status"] });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!allocation) return;
    if (!window.confirm("Delete this allocation? This cannot be undone.")) return;
    await fetch(`/api/admin/land-allocations/${allocation.id}`, { method: "DELETE" });
    router.push("/admin/land-allocations");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !allocation) {
    return (
      <div>
        <Link
          href="/admin/land-allocations"
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to land allocations
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Allocation not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit {allocation.allocationCode}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <LandAllocationForm initial={allocation} allocationId={allocation.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href="/admin/land-allocations"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to land allocations
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{allocation.allocationCode}</h1>
          <StatusBadge value={allocation.status} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/land-allocations/${allocation.id}/document`}
            className="inline-flex items-center rounded-md bg-brand-green px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Download allocation document
          </a>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Allocation No.">
            <span className="font-medium text-neutral-900">{allocation.allocationCode}</span>
          </DetailRow>
          <DetailRow label="Status">
            <select
              value={allocation.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {ALLOCATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </DetailRow>
          <DetailRow label="Project">
            <div>
              <div className="font-medium text-neutral-900">{allocation.landProject?.name || "—"}</div>
              {allocation.landProject?.code ? (
                <div className="text-xs text-neutral-500">{allocation.landProject.code}</div>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow label="Plot">{allocation.plot?.plotNumber || "—"}</DetailRow>
          <DetailRow label="Client">
            <div>
              <div className="font-medium text-neutral-900">
                {allocation.client?.companyName || allocation.client?.contactName || "—"}
              </div>
              {allocation.client?.email ? (
                <div className="text-xs text-neutral-500">{allocation.client.email}</div>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow label="Amount">
            <span className="font-medium text-neutral-900">{formatMoney(allocation.amount)}</span>
          </DetailRow>
          <DetailRow label="Allocated date">{formatDate(allocation.allocatedAt)}</DetailRow>
          <DetailRow label="Signed date">{allocation.signedAt ? formatDate(allocation.signedAt) : "—"}</DetailRow>
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
        Delete allocation
      </button>
    </div>
  );
}
