"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTime, type ProjectUpdate } from "@/lib/admin/types";

export function ProjectWorkLogSection({ projectId }: { projectId: string }) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch(`/api/admin/projects/${projectId}/updates`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => [])) as ProjectUpdate[];
        if (!res.ok) throw new Error("Could not load the work log.");
        setUpdates(Array.isArray(body) ? body : []);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900">Work log</h2>
        <p className="text-xs text-neutral-500">Site updates posted by the project team.</p>
      </div>

      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-6 text-center text-sm text-neutral-400">Loading work log…</p>
      ) : updates.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400">No work logged yet.</p>
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
    </section>
  );
}
