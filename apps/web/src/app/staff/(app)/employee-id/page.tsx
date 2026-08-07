"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  idFullName,
  type EmployeeIdCard,
} from "@/lib/admin/types";

export default function StaffEmployeeIdPage() {
  const [card, setCard] = useState<EmployeeIdCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/employee-id", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (EmployeeIdCard & { message?: string })
          | null;
        if (!res.ok) throw new Error(body?.message ?? "Could not load your ID card.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setCard(record);
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
  }, []);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My ID card</h1>
        <p className="text-sm text-neutral-500">
          Your digital staff card with the QR code guards can scan to verify you.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading…
        </div>
      ) : !card ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">No ID card has been issued to you yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Please contact Human Resources.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
            <dl className="divide-y divide-neutral-100">
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Status</dt>
                <dd className="text-sm text-neutral-900"><StatusBadge value={card.status} /></dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Name</dt>
                <dd className="text-sm text-neutral-900">{idFullName(card.employee)}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Staff code</dt>
                <dd className="text-sm text-neutral-900">{card.employee?.employeeCode ?? "—"}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Department</dt>
                <dd className="text-sm text-neutral-900">{card.employee?.department?.name ?? "—"}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Position</dt>
                <dd className="text-sm text-neutral-900">{card.employee?.position?.title ?? "—"}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Card number</dt>
                <dd className="text-sm text-neutral-900">{card.cardNumber}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Issued</dt>
                <dd className="text-sm text-neutral-900">{formatDate(card.issuedAt)}</dd>
              </div>
              <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
                <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-44">Expires</dt>
                <dd className="text-sm text-neutral-900">
                  {card.expiresAt ? formatDate(card.expiresAt) : "No expiry"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/api/staff/employee-id/card"
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Download my ID card (PDF)
            </a>
            <Link
              href="/verify/employee-id"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-brand-blue hover:text-brand-blue"
            >
              Try the public verify page
            </Link>
          </div>
        </>
      )}
    </div>
  );
}