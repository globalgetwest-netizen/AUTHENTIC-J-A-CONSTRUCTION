"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  type StaffProjectDetail,
} from "@/lib/admin/types";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{k}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function StaffProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<StaffProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    fetch(`/api/staff/projects/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (StaffProjectDetail & { message?: string }) | null;
        if (!res.ok) throw new Error(body?.message ?? "Could not load this project.");
        return body;
      })
      .then((record) => {
        setDetail(record);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function postUpdate() {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/staff/projects/${id}/updates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not post the work log.");
      setContent("");
      setMessage("Work log posted.");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not post the work log.");
    } finally {
      setBusy(false);
    }
  }

  async function completeMilestone(milestoneId: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/staff/projects/${id}/milestones/${milestoneId}/complete`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not mark the phase done.");
      setMessage("Phase marked done.");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not mark the phase done.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div>
        <Link href="/staff/projects" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to projects
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  const { project, capabilities } = detail;
  const milestones = project.milestones ?? [];
  const updates = project.updates ?? [];
  const remaining = milestones.filter((m) => m.status !== "COMPLETED").length;
  const done = milestones.length - remaining;

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/staff/projects" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to projects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
          <StatusBadge value={project.status} />
        </div>
        <p className="text-sm text-neutral-500">{project.code}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <Row k="Type">
            <StatusBadge value={project.projectType} />
          </Row>
          <Row k="Location">{project.location || "—"}</Row>
          <Row k="Budget">{formatMoney(project.budgetAmount)}</Row>
          <Row k="Start date">{formatDate(project.startDate)}</Row>
          <Row k="End date">{formatDate(project.endDate)}</Row>
          <Row k="Manager">
            {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—"}
          </Row>
          <Row k="Description">{project.description || "—"}</Row>
        </dl>
        {message && <p className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-500">{message}</p>}
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Phases</h2>
          <span className="text-xs text-neutral-500">
            {done}/{milestones.length} done
          </span>
        </div>

        {milestones.length === 0 ? (
          <p className="text-sm text-neutral-500">No phases have been set up yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-neutral-900">{m.title}</p>
                    <StatusBadge value={m.status} />
                  </div>
                  {m.description && <p className="mt-0.5 text-xs text-neutral-500">{m.description}</p>}
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Due {formatDate(m.dueDate)}
                    {m.completedAt ? ` · Completed ${formatDate(m.completedAt)}` : ""}
                  </p>
                </div>
                {capabilities.canManage && m.status !== "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => completeMilestone(m.id)}
                    disabled={busy}
                    className="shrink-0 rounded-md border border-brand-blue bg-brand-blue/5 px-2.5 py-1 text-xs font-medium text-brand-blue transition hover:bg-brand-blue/10 disabled:opacity-50"
                  >
                    Mark done
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Work log</h2>

        {capabilities.canLogWork && (
          <div className="mb-4 space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Log site progress, materials received, issues…"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={postUpdate}
                disabled={busy || !content.trim()}
                className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-blue/90 disabled:opacity-50"
              >
                Post work log
              </button>
            </div>
          </div>
        )}

        {updates.length === 0 ? (
          <p className="text-sm text-neutral-500">No work logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {updates.map((u) => (
              <li key={u.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                <p className="text-sm text-neutral-800">{u.content}</p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {u.authorName ?? "Unknown"} — {formatDateTime(u.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!capabilities.canLogWork && !capabilities.canManage && (
          <p className="text-xs text-neutral-400">
            You have read-only access to this project.
          </p>
        )}
      </section>
    </div>
  );
}
