"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmployeeIdEditForm } from "@/components/admin/EmployeeIdEditForm";
import { type EmployeeIdCard } from "@/lib/admin/types";

export default function EditEmployeeIdPage() {
  const { id } = useParams<{ id: string }>();
  const [card, setCard] = useState<EmployeeIdCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/employee-ids/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (EmployeeIdCard & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this card.");
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
  }, [id]);

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href={`/admin/employee-ids/${id}`}
        className="inline-block text-sm font-semibold text-brand-blue hover:underline"
      >
        ← Back to card
      </Link>

      <div>
        <h1 className="text-xl font-bold text-neutral-900">Edit ID card</h1>
        <p className="text-sm text-neutral-500">
          Update the holder details, type or photo. The change applies to this card only.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
          Loading…
        </div>
      ) : error || !card ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Could not load this card."}
        </p>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <EmployeeIdEditForm card={card} />
        </div>
      )}
    </div>
  );
}
