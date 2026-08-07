import Link from "next/link";
import { apiFetch } from "@/lib/admin/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDateTime,
  formatMoney,
  type StaffProjectSummary,
  type StaffProjectsResult,
} from "@/lib/admin/types";

function PhaseProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
        <span>Phases</span>
        <span>
          {done}/{total} done
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-brand-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function StaffProjects() {
  const res = await apiFetch("/staff/projects");
  let result: StaffProjectsResult = { data: [], meta: { total: 0 } };
  if (res.ok) {
    result = (await res.json()) as StaffProjectsResult;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Projects</h1>
        <p className="text-sm text-neutral-500">
          Work logs, phases, and progress on the projects you can see.
        </p>
      </div>

      {!res.ok ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Could not load your projects. Try again.
        </p>
      ) : result.data.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          No projects are visible to your account yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((p: StaffProjectSummary) => (
            <Link
              key={p.id}
              href={`/staff/projects/${p.id}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-blue hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-900 group-hover:text-brand-blue">
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-500">{p.code}</p>
                </div>
                <StatusBadge value={p.status} />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Budget</span>
                  <span className="font-medium text-neutral-900">{formatMoney(p.budgetAmount)}</span>
                </div>
                <PhaseProgress done={p.completedMilestones} total={p.milestoneCount} />
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{p.updateCount} work log{p.updateCount === 1 ? "" : "s"}</span>
                  {p.latestUpdate && (
                    <span>{formatDateTime(p.latestUpdate.publishedAt)}</span>
                  )}
                </div>
              </div>

              {p.latestUpdate && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <p className="line-clamp-2 text-xs text-neutral-600">{p.latestUpdate.content}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {p.latestUpdate.authorName ?? "Unknown"} — {formatDateTime(p.latestUpdate.publishedAt)}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
