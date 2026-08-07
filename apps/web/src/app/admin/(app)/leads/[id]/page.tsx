"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, formatMoney, label, type Lead } from "@/lib/admin/types";

const LEAD_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{label}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/leads/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Lead & { message?: string }) | null;
        if (!res.ok) throw new Error(body?.message ?? "Could not load this lead.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setLead(record);
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
    const status = e.target.value;
    if (!lead || !status) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setLead({ ...lead, status });
      setMessage("Status saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!lead) return;
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
    router.push("/admin/leads");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div>
        <Link href="/admin/leads" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to leads
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Lead not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/leads" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to leads
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{lead.name}</h1>
          <StatusBadge value={lead.status} />
        </div>
        <p className="text-sm text-neutral-500">{lead.leadNo}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <Row label="Status">
            <select
              value={lead.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Source">
            <StatusBadge value={lead.source} />
          </Row>
          <Row label="Company">{lead.company || "—"}</Row>
          <Row label="Email">{lead.email || "—"}</Row>
          <Row label="Phone">{lead.phone || "—"}</Row>
          <Row label="Expected value">{formatMoney(lead.expectedValue)}</Row>
          <Row label="Notes">{lead.notes || "—"}</Row>
          <Row label="Created">{formatDateTime(lead.createdAt)}</Row>
        </dl>
        {message && (
          <p className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-500">{message}</p>
        )}
        <div className="flex gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            onClick={remove}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Delete lead
          </button>
        </div>
      </div>
    </div>
  );
}