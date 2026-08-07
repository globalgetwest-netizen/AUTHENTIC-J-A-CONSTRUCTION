import { apiFetch } from "@/lib/admin/auth";
import { formatDateTime, label, type Employee } from "@/lib/admin/types";

interface StaffProfile {
  user: { id: string; email: string; firstName: string; lastName: string; roles: string[] };
  employee: Employee | null;
}

interface NotificationRow {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationsResult {
  data: NotificationRow[];
  meta: { total: number; totalUnread: number };
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-500">{k}</span>
      <span className="text-right font-medium text-neutral-900">{v || "—"}</span>
    </div>
  );
}

function ProfileCard({ employee, roles }: { employee: Employee | null; roles: string[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-neutral-800">My profile</h2>
      {!employee ? (
        <p className="text-sm text-neutral-500">
          No employee record is linked to this account yet. An administrator can link one.
        </p>
      ) : (
        <div>
          <p className="text-lg font-bold text-neutral-900">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-sm text-neutral-500">{employee.employeeCode}</p>
          <div className="mt-3">
            <Row k="Department" v={employee.department?.name || "—"} />
            <Row k="Position" v={employee.position?.title || "—"} />
            <Row k="Branch" v={employee.branch?.name || "—"} />
            <Row k="Employment type" v={label(employee.employmentType)} />
            <Row k="Hired" v={formatDateTime(employee.hireDate)} />
            <Row k="Role" v={roles.join(", ")} />
          </div>
        </div>
      )}
    </div>
  );
}

export default async function StaffDashboard() {
  const [profileRes, notifRes] = await Promise.all([
    apiFetch("/staff/profile"),
    apiFetch("/staff/notifications"),
  ]);

  let profile: StaffProfile | null = null;
  if (profileRes.ok) {
    profile = (await profileRes.json()) as StaffProfile;
  }

  let notif: NotificationsResult = { data: [], meta: { total: 0, totalUnread: 0 } };
  if (notifRes.ok) {
    notif = (await notifRes.json()) as NotificationsResult;
  }

  const roles = profile?.user.roles ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">
          Welcome, {profile?.user.firstName ?? "there"}
        </h1>
        <p className="text-sm text-neutral-500">Your employee overview and notifications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard employee={profile?.employee ?? null} roles={roles} />
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">Notifications</h2>
            {notif.meta.totalUnread > 0 && (
              <span className="rounded-full bg-brand-blue px-2 py-0.5 text-xs font-semibold text-white">
                {notif.meta.totalUnread} unread
              </span>
            )}
          </div>
          {notif.data.length === 0 ? (
            <p className="text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {notif.data.map((n) => (
                <li key={n.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-900">{n.title}</span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}