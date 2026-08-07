"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@ajac/ui";
import { Logo } from "./Logo";
import { COMPANY } from "../config/company";
import { Icon } from "./icons";
import { isAdmin, isStaff, isClient } from "../lib/auth/roles";

interface LoginResponse {
  user?: { roles?: string[] };
  message?: string;
}

export function LoginForm({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as LoginResponse | null;
      if (!res.ok) {
        setError(data?.message ?? "Sign in failed. Try again.");
        setStatus("error");
        return;
      }

      const roles = data?.user?.roles ?? [];
      if (isAdmin(roles)) {
        router.push("/admin");
      } else if (isStaff(roles)) {
        router.push("/staff");
      } else if (isClient(roles)) {
        router.push("/client");
      } else {
        setError("Your account does not have portal access.");
        setStatus("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the sign-in service. Try again.");
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-950 px-4">
      <div className="ajac-fade-in w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <Logo width={44} />
        </div>
        <div className="mt-5">
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{COMPANY.shortName} {subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@authenticja.com"
              required
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}