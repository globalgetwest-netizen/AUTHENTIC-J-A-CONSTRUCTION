"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import type { LandProject } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function LandProjectForm({
  initial = null,
  projectId = null,
}: {
  initial?: LandProject | null;
  projectId?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [totalPlots, setTotalPlots] = useState(
    initial?.totalPlots != null ? String(initial.totalPlots) : "",
  );
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("A name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        projectId ? `/api/admin/land-projects/${projectId}` : "/api/admin/land-projects",
        {
          method: projectId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim() || null,
            description: description.trim() || null,
            totalPlots: totalPlots ? Number(totalPlots) : null,
            status,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save project.");
      const id = body?.id ?? projectId;
      if (id) {
        router.push(`/admin/land-projects/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project.");
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
        <div>
          <label className={labelClass} htmlFor="lp-name">
            Name *
          </label>
          <input
            id="lp-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kwadaso Estate"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lp-location">
            Location
          </label>
          <input
            id="lp-location"
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lp-total">
            Total plots
          </label>
          <input
            id="lp-total"
            type="number"
            min="0"
            className={inputClass}
            value={totalPlots}
            onChange={(e) => setTotalPlots(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lp-status">
            Status
          </label>
          <input
            id="lp-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="ACTIVE"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="lp-desc">
            Description
          </label>
          <textarea
            id="lp-desc"
            rows={3}
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {projectId ? "Save changes" : "Create project"}
        </Button>
        <a
          href={projectId ? `/admin/land-projects/${projectId}` : "/admin/land-projects"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
