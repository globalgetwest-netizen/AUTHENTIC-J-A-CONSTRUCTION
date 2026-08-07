"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseStatus,
  type Project,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm({ initial = null }: { initial?: Expense | null }) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [incurredOn, setIncurredOn] = useState(
    initial?.incurredOn ? initial.incurredOn.slice(0, 10) : today(),
  );
  const [status, setStatus] = useState<ExpenseStatus>(initial?.status ?? "PENDING");
  const [projectId, setProjectId] = useState(initial?.projectId ?? "");
  const [receiptUrl, setReceiptUrl] = useState(initial?.receiptUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/projects?pageSize=100", { cache: "no-store" })
      .then((r) =>
        r
          .json()
          .catch(() => null)
          .then((b) => (b?.data ?? []) as Project[]),
      )
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim()) return setError("A category is required.");
    if (!description.trim()) return setError("A description is required.");
    if (!amount || Number(amount) <= 0) return setError("A valid amount is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        initial ? `/api/admin/expenses/${initial.id}` : "/api/admin/expenses",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            category: category.trim(),
            description: description.trim(),
            amount: Number(amount),
            incurredOn: incurredOn || null,
            status,
            projectId: projectId || null,
            receiptUrl: receiptUrl.trim() || null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save expense.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/expenses/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
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
          <label className={labelClass} htmlFor="exp-category">Category *</label>
          <input
            id="exp-category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. FUEL, MATERIALS, LABOUR…"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="exp-amount">Amount (GHS) *</label>
          <input
            id="exp-amount"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="exp-description">Description *</label>
          <textarea
            id="exp-description"
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What was this expense for?"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="exp-date">Incurred on</label>
          <input
            id="exp-date"
            type="date"
            className={inputClass}
            value={incurredOn}
            onChange={(e) => setIncurredOn(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="exp-status">Status</label>
          <select
            id="exp-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
          >
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="exp-project">Project</label>
          <select
            id="exp-project"
            className={inputClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="exp-receipt">Receipt URL</label>
          <input
            id="exp-receipt"
            className={inputClass}
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add expense"}</Button>
        <a
          href={initial ? `/admin/expenses/${initial.id}` : "/admin/expenses"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}