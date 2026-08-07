"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, type AssetAssignment } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function AssetAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssetAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    fetch(`/api/admin/asset-assignments/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (AssetAssignment & { message?: string })
          | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this assignment.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setAssignment(record);
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

  useEffect(() => {
    load();
  }, [load]);

  async function markReturned() {
    if (!assignment) return;
    if (!window.confirm("Mark this asset as returned?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/asset-assignments/${assignment.id}/return`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not mark the asset as returned.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark the asset as returned.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!assignment) return;
    if (!window.confirm("Delete this assignment record?")) return;
    const res = await fetch(`/api/admin/asset-assignments/${assignment.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Could not delete assignment.");
      return;
    }
    router.push("/admin/asset-assignments");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/asset-assignments"
          className="inline-block text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to asset assignments
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Assignment not found."}
        </p>
      </div>
    );
  }

  const returned = Boolean(assignment.returnedAt);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/asset-assignments"
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to asset assignments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{assignment.asset?.name || "Asset assignment"}</h1>
          <p className="text-sm text-neutral-500">{returned ? "Returned assignment" : "Active assignment"}</p>
        </div>
        <Button variant="danger" onClick={remove}>
          Delete
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Asset">
            <Link
              href={`/admin/assets/${assignment.asset?.id}`}
              className="font-semibold text-brand-blue hover:underline"
            >
              {assignment.asset?.name} ({assignment.asset?.assetCode})
            </Link>
          </DetailRow>
          <DetailRow label="Assigned to">
            <Link
              href={`/admin/employees/${assignment.assignedToId}`}
              className="font-semibold text-brand-blue hover:underline"
            >
              Employee {assignment.assignedToId}
            </Link>
          </DetailRow>
          <DetailRow label="Assigned at">{formatDate(assignment.assignedAt)}</DetailRow>
          <DetailRow label="Returned at">
            {assignment.returnedAt ? (
              <span className="text-green-600">{formatDate(assignment.returnedAt)}</span>
            ) : (
              <StatusBadge value="Active" />
            )}
          </DetailRow>
          {assignment.assignedById && (
            <DetailRow label="Assigned by">Employee {assignment.assignedById}</DetailRow>
          )}
          {assignment.notes && <DetailRow label="Notes">{assignment.notes}</DetailRow>}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        {!returned && (
          <Button onClick={markReturned} loading={busy}>
            Mark as returned
          </Button>
        )}
      </div>
    </div>
  );
}