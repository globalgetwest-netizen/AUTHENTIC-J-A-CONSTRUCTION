"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@ajac/ui";
import { StatusBadge } from "./StatusBadge";
import { EntityForm, type FormField, type SubmitResult } from "./EntityForm";
import { formatDate, label, MILESTONE_STATUSES, type ProjectMilestone } from "@/lib/admin/types";

const FIELDS: FormField[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
  { key: "dueDate", label: "Due date", type: "date" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: MILESTONE_STATUSES.map((s) => ({ value: s, label: label(s) })),
  },
];

function toInitial(m: ProjectMilestone): Record<string, string> {
  return {
    title: m.title,
    description: m.description ?? "",
    dueDate: m.dueDate ? m.dueDate.slice(0, 10) : "",
    status: m.status,
  };
}

export function ProjectMilestonesSection({ projectId }: { projectId: string }) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<null | "create" | ProjectMilestone>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    fetch(`/api/admin/projects/${projectId}/milestones`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => [])) as ProjectMilestone[];
        if (!res.ok) throw new Error("Could not load phases.");
        setMilestones(Array.isArray(body) ? body : []);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(values: Record<string, string>, editing?: ProjectMilestone): Promise<SubmitResult> {
    const payload: Record<string, string> = {};
    for (const f of FIELDS) {
      if (values[f.key]) payload[f.key] = values[f.key];
    }
    const url = `/api/admin/projects/${projectId}/milestones${editing ? `/${editing.id}` : ""}`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) return { ok: false, error: body?.message ?? "Could not save the phase." };
    load();
    return { ok: true };
  }

  async function remove(m: ProjectMilestone) {
    if (!window.confirm(`Delete the phase "${m.title}"?`)) return;
    const res = await fetch(`/api/admin/projects/${projectId}/milestones/${m.id}`, { method: "DELETE" });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) {
      setMessage(body?.message ?? "Could not delete the phase.");
      return;
    }
    setMessage("Phase deleted.");
    load();
  }

  async function complete(m: ProjectMilestone) {
    const res = await fetch(`/api/admin/projects/${projectId}/milestones/${m.id}/complete`, {
      method: "POST",
    });
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) {
      setMessage(body?.message ?? "Could not mark the phase done.");
      return;
    }
    setMessage("Phase marked done.");
    load();
  }

  const done = milestones.filter((m) => m.status === "COMPLETED").length;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Phases</h2>
          <p className="text-xs text-neutral-500">
            {milestones.length > 0 ? `${done}/${milestones.length} done` : "Milestones / phases"}
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => setForm("create")}>
          Add phase
        </Button>
      </div>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-3 text-xs text-neutral-500">{message}</p>}

      {loading ? (
        <p className="py-6 text-center text-sm text-neutral-400">Loading phases…</p>
      ) : milestones.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">No phases yet. Add the first one.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
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
              <div className="flex shrink-0 items-center gap-2">
                {m.status !== "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => complete(m)}
                    className="rounded-md border border-brand-blue bg-brand-blue/5 px-2.5 py-1 text-xs font-medium text-brand-blue transition hover:bg-brand-blue/10"
                  >
                    Mark done
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setForm(m)}
                  className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(m)}
                  className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <EntityForm
          title={form === "create" ? "Add phase" : `Edit phase`}
          fields={FIELDS}
          initial={form === "create" ? { status: "NOT_STARTED" } : toInitial(form)}
          submitLabel={form === "create" ? "Create" : "Save changes"}
          onSubmit={(values) => save(values, form === "create" ? undefined : form)}
          onCancel={() => setForm(null)}
        />
      )}
    </section>
  );
}
