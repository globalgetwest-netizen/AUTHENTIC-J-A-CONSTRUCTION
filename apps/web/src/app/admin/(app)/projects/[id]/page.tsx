"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProjectMilestonesSection } from "@/components/admin/ProjectMilestonesSection";
import { ProjectWorkLogSection } from "@/components/admin/ProjectWorkLogSection";
import { ProjectMembersSection } from "@/components/admin/ProjectMembersSection";
import { formatDate, formatMoney, label, type Project } from "@/lib/admin/types";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{label}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/projects/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (Project & { message?: string }) | null;
        if (!res.ok) throw new Error(body?.message ?? "Could not load this project.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setProject(record);
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
    if (!project || !status) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setProject({ ...project, status });
      setMessage("Status saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!project) return;
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    await fetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    router.push("/admin/projects");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div>
        <Link href="/admin/projects" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to projects
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/projects" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to projects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
          <StatusBadge value={project.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {project.status === "COMPLETED" ? (
            <a
              href={`/api/admin/projects/${project.id}/completion-certificate`}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Download completion certificate
            </a>
          ) : null}
          <p className="text-sm text-neutral-500">{project.code}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <Row label="Status">
            <select
              value={project.status}
              onChange={changeStatus}
              disabled={saving}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Type">
            <StatusBadge value={project.projectType} />
          </Row>
          <Row label="Location">{project.location || "—"}</Row>
          <Row label="Address">{project.address || "—"}</Row>
          <Row label="Budget">{formatMoney(project.budgetAmount)}</Row>
          <Row label="Start date">{formatDate(project.startDate)}</Row>
          <Row label="End date">{formatDate(project.endDate)}</Row>
          <Row label="Description">{project.description || "—"}</Row>
          <Row label="Created">{formatDate(project.createdAt)}</Row>
        </dl>
        {message && <p className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-500">{message}</p>}
        <div className="flex gap-2 border-t border-neutral-100 px-5 py-3">
          <button
            type="button"
            onClick={remove}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Delete project
          </button>
        </div>
      </div>

      <ProjectMilestonesSection projectId={project.id} />
      <ProjectWorkLogSection projectId={project.id} />
      <ProjectMembersSection projectId={project.id} />
    </div>
  );
}