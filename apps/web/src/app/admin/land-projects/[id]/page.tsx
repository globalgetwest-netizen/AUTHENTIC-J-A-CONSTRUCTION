"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { LandProjectForm } from "@/components/admin/LandProjectForm";
import { label, type LandProject } from "@/lib/admin/types";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

export default function LandProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<LandProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/land-projects/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (LandProject & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this project.");
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

  async function changeStatus(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (!project) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/land-projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not update status.");
      setProject({ ...project, status: next });
      setMessage("Status saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!project) return;
    if (!window.confirm("Delete this land project? This cannot be undone.")) return;
    await fetch(`/api/admin/land-projects/${project.id}`, { method: "DELETE" });
    router.push("/admin/land-projects");
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
        <Link href="/admin/land-projects" className="text-sm font-semibold text-brand-blue hover:underline">
          ← Back to land projects
        </Link>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Land project not found."}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">Edit {project.name}</h1>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel editing
          </Button>
        </div>
        <LandProjectForm initial={project} projectId={project.id} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/admin/land-projects" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to land projects
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
            {label(project.status)}
          </span>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <dl className="divide-y divide-neutral-100 px-5">
          <DetailRow label="Code">
            <span className="font-medium text-neutral-900">{project.code}</span>
          </DetailRow>
          <DetailRow label="Status">
            <input
              value={project.status}
              onChange={changeStatus}
              disabled={saving}
              className="w-48 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none"
              placeholder="ACTIVE"
            />
          </DetailRow>
          <DetailRow label="Location">{project.location || "—"}</DetailRow>
          <DetailRow label="Total plots">{project.totalPlots ?? "—"}</DetailRow>
          <DetailRow label="Plots created">{project._count?.plots ?? 0}</DetailRow>
          <DetailRow label="Allocations">{project._count?.allocations ?? 0}</DetailRow>
          <DetailRow label="Description">{project.description || "—"}</DetailRow>
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
        Delete land project
      </button>
    </div>
  );
}
