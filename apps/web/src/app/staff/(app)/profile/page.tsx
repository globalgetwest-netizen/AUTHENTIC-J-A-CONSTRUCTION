"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input } from "@ajac/ui";
import { formatDateTime, label, type Employee } from "@/lib/admin/types";

interface StaffProfile {
  user: { id: string; email: string; firstName: string; lastName: string; roles: string[] };
  employee: Employee | null;
}

function FieldRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-0">
      <span className="text-neutral-500">{k}</span>
      <span className="text-right font-medium text-neutral-900">{v || "—"}</span>
    </div>
  );
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/profile", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (StaffProfile & { message?: string }) | null;
        if (!res.ok || !body?.user) throw new Error(body?.message ?? "Failed to load profile.");
        if (!cancelled) {
          setProfile(body);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwStatus === "loading") return;
    if (newPassword !== confirmPassword) {
      setPwStatus("error");
      setPwError("New passwords do not match.");
      return;
    }
    setPwStatus("loading");
    setPwError("");
    try {
      const res = await fetch("/api/staff/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setPwStatus("error");
        setPwError(data?.message ?? "Could not change your password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwStatus("done");
    } catch {
      setPwStatus("error");
      setPwError("Could not reach the server. Try again.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading your profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center text-sm text-red-800">
        {error || "Profile unavailable."}
      </div>
    );
  }

  const emp = profile.employee;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My profile</h1>
        <p className="text-sm text-neutral-500">Your details and account security.</p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-lg font-bold text-neutral-900">
          {profile.user.firstName} {profile.user.lastName}
        </p>
        <p className="text-sm text-neutral-500">{profile.user.email}</p>
        <div className="mt-3">
          <FieldRow k="Employee no." v={emp?.employeeCode} />
          <FieldRow
            k="Department"
            v={emp?.department?.name ? emp.department.name : "—"}
          />
          <FieldRow k="Position" v={emp?.position?.title || "—"} />
          <FieldRow k="Branch" v={emp?.branch?.name || "—"} />
          <FieldRow k="Phone" v={emp?.phone} />
          <FieldRow k="Employment type" v={emp ? label(emp.employmentType) : "—"} />
          <FieldRow k="Hired" v={emp ? formatDateTime(emp.hireDate) : "—"} />
          <FieldRow k="Status" v={emp ? label(emp.status) : "—"} />
          <FieldRow k="Roles" v={profile.user.roles.join(", ")} />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-800">Change password</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          All your other sessions will be signed out.
        </p>

        <form onSubmit={onChangePassword} className="mt-4 max-w-sm space-y-4">
          <Field label="Current password" htmlFor="pw-current">
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          <Field label="New password" htmlFor="pw-new">
            <Input
              id="pw-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm">
            <Input
              id="pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </Field>

          {pwError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {pwError}
            </p>
          )}
          {pwStatus === "done" && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              Password updated.
            </p>
          )}

          <Button type="submit" variant="primary" loading={pwStatus === "loading"}>
            {pwStatus === "loading" ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}