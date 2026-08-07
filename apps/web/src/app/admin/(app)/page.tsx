import Link from "next/link";
import { apiFetch } from "@/lib/admin/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, type Lead } from "@/lib/admin/types";

interface ListResult<T> {
  data: T[];
  meta: { total: number };
}

const PAGE_SIZE = 1;

async function countTotal(path: string): Promise<number> {
  try {
    const res = await apiFetch(`${path}?pageSize=${PAGE_SIZE}`);
    if (!res.ok) return 0;
    const body = (await res.json()) as ListResult<unknown>;
    return body?.meta?.total ?? 0;
  } catch {
    return 0;
  }
}

function StatCard({
  label: headline,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-brand-blue/40 hover:shadow-sm"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{headline}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900">{value}</div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const [leadCount, clientCount, projectCount, recentRes] = await Promise.all([
    countTotal("/leads"),
    countTotal("/clients"),
    countTotal("/projects"),
    apiFetch("/leads?pageSize=6&sortBy=createdAt&sortOrder=desc"),
  ]);

  let recent: Lead[] = [];
  if (recentRes.ok) {
    const body = (await recentRes.json()) as { data: Lead[] };
    recent = body?.data ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">A live view of AUTHENTIC J.A.&apos;s back office.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Leads" value={String(leadCount)} href="/admin/leads" />
        <StatCard label="Clients" value={String(clientCount)} href="/admin/clients" />
        <StatCard label="Projects" value={String(projectCount)} href="/admin/projects" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">Recent leads</h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-10 text-center text-sm text-neutral-500">
            No leads yet — they will appear here as they arrive.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-100">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    Lead
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recent.map((lead) => (
                  <tr key={lead.id} className="transition hover:bg-blue-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-800">
                      <Link href={`/admin/leads/${lead.id}`} className="font-semibold hover:text-brand-blue">
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-800">
                      <StatusBadge value={lead.source} />
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-800">
                      <StatusBadge value={lead.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                      {formatDateTime(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}