import { apiFetch } from "@/lib/admin/auth";
import { formatDate, formatMoney, label, type Client, type Quotation } from "@/lib/admin/types";

interface ClientProfile {
  user: { id: string; email: string; firstName: string; lastName: string; roles: string[] };
  client: Client | null;
}

interface QuotationsResult {
  data: Quotation[];
  meta: { total: number; limit: number };
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-500">{k}</span>
      <span className="text-right font-medium text-neutral-900">{v || "—"}</span>
    </div>
  );
}

function ProfileCard({ client }: { client: Client | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-neutral-800">My profile</h2>
      {!client ? (
        <p className="text-sm text-neutral-500">
          No client record is linked to this account yet. An administrator can link one.
        </p>
      ) : (
        <div>
          <p className="text-lg font-bold text-neutral-900">{client.contactName}</p>
          <p className="text-sm text-neutral-500">{client.clientCode}</p>
          <div className="mt-3">
            <Row k="Company" v={client.companyName || "—"} />
            <Row k="Type" v={label(client.type)} />
            <Row k="Email" v={client.email} />
            <Row k="Phone" v={client.phone} />
            <Row k="Status" v={label(client.status)} />
            <Row k="Client since" v={formatDate(client.createdAt)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default async function ClientDashboard() {
  const [profileRes, quotesRes] = await Promise.all([
    apiFetch("/client/profile"),
    apiFetch("/client/quotations"),
  ]);

  let profile: ClientProfile | null = null;
  if (profileRes.ok) {
    profile = (await profileRes.json()) as ClientProfile;
  }

  let quotes: QuotationsResult = { data: [], meta: { total: 0, limit: 20 } };
  if (quotesRes.ok) {
    quotes = (await quotesRes.json()) as QuotationsResult;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          Welcome, {profile?.user.firstName ?? "there"}
        </h1>
        <p className="text-sm text-neutral-500">Your account overview and documents.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard client={profile?.client ?? null} />

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">Quotations</h2>
            {quotes.meta.total > 0 && (
              <span className="rounded-full bg-brand-blue px-2 py-0.5 text-xs font-semibold text-white">
                {quotes.meta.total} total
              </span>
            )}
          </div>
          {quotes.data.length === 0 ? (
            <p className="text-sm text-neutral-500">No quotations have been issued to you yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {quotes.data.map((q) => (
                <li key={q.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{q.title}</p>
                      <p className="text-xs text-neutral-500">
                        {q.quotationNo} · {label(q.status)}
                      </p>
                      {q.validUntil && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          Valid until {formatDate(q.validUntil)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatMoney(q.total)}
                      </p>
                      <a
                        href={`/api/client/quotation/${q.id}/pdf`}
                        className="text-xs font-medium text-brand-blue hover:underline"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}