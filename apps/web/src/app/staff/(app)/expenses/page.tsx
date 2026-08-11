"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { WorkArea } from "@/components/staff/WorkArea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Field, inputClass, useCatalog, useIsDepartmentHead } from "@/lib/staff/ui";
import { formatDate, formatMoney, type Expense, type StaffProjectSummary } from "@/lib/admin/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Raise a department expense — always recorded as PENDING for the head to approve. */
function CreateExpense({ onCreated }: { onCreated: () => void }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredOn, setIncurredOn] = useState(today());
  const [projectId, setProjectId] = useState("");
  const projects = useCatalog<StaffProjectSummary>("/api/staff/projects?pageSize=100");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim()) return setError("A category is required.");
    if (!description.trim()) return setError("A description is required.");
    if (!amount || Number(amount) <= 0) return setError("A valid amount is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          description: description.trim(),
          amount: Number(amount),
          incurredOn: incurredOn || null,
          projectId: projectId || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save expense.");
      setCategory("");
      setDescription("");
      setAmount("");
      setProjectId("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Raise an expense</h2>
        <p className="text-xs text-neutral-500">
          New expenses go to your department head as PENDING for approval.
        </p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category *">
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. FUEL, MATERIALS, LABOUR…"
          />
        </Field>
        <Field label="Amount (GHS) *">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Description *" span>
          <textarea
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What was this expense for?"
          />
        </Field>
        <Field label="Incurred on">
          <input type="date" className={inputClass} value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
        </Field>
        <Field label="Project (optional)">
          <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <Button type="submit" loading={busy}>Raise expense</Button>
      </div>
    </form>
  );
}

/** Approve a PENDING expense (visible to the department head). */
function ApproveExpense({ expense, reload }: { expense: Expense; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (expense.status !== "PENDING") return null;

  async function approve() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/staff/expenses/${expense.id}/approve`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not approve expense.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={busy}
        className="rounded-md bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue/90 disabled:opacity-50"
      >
        {busy ? "…" : "Approve"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}

export default function StaffExpensesPage() {
  const isHead = useIsDepartmentHead();

  return (
    <WorkArea<Expense>
      title="Expenses"
      subtitle="Company spend raised within your department, and the approvals awaiting your head."
      api="/api/staff/expenses"
      searchPlaceholder="Search description or category…"
      empty="No expenses yet. Raise your first departmental expense above."
      form={(onCreated) => <CreateExpense onCreated={onCreated} />}
      action={
        isHead
          ? {
              header: "Action",
              render: (row, reload) => <ApproveExpense expense={row} reload={reload} />,
            }
          : undefined
      }
      columns={[
        { key: "expenseNo", header: "Expense", render: (e) => <span className="font-medium text-neutral-700">{e.expenseNo}</span> },
        { key: "description", header: "Description", render: (e) => e.description },
        { key: "amount", header: "Amount", render: (e) => formatMoney(e.amount) },
        { key: "incurredOn", header: "Incurred on", render: (e) => formatDate(e.incurredOn) },
        { key: "createdBy", header: "Raised by", render: (e) => (e.createdBy ? `${e.createdBy.firstName} ${e.createdBy.lastName}` : "—") },
        { key: "status", header: "Status", render: (e) => <StatusBadge value={e.status} /> },
      ]}
    />
  );
}
