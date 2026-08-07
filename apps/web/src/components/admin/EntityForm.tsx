"use client";

import { useState } from "react";
import { Button } from "@ajac/ui";
import { Icon } from "../icons";

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "select" | "date" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

type Values = Record<string, string>;

export type SubmitResult = { ok: boolean; error?: string };

export function EntityForm({
  title,
  fields,
  initial,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  title: string;
  fields: FormField[];
  initial?: Values;
  submitLabel?: string;
  onSubmit: (values: Values) => Promise<SubmitResult | void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Values>(initial ?? {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await onSubmit(values);
      if (result && result.ok === false) {
        setError(result.error ?? "Could not save. Try again.");
        return;
      }
      onCancel();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ajac-fade-in">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => {
            const full = f.type === "textarea";
            const span = full ? "sm:col-span-2" : "";
            return (
              <label key={f.key} className={`flex flex-col gap-1 text-sm ${span}`}>
                <span className="font-medium text-neutral-700">
                  {f.label}
                  {f.required && <span className="text-red-600"> *</span>}
                </span>
                {f.type === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    onChange={set(f.key)}
                    required={f.required}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{f.placeholder ?? "Select…"}</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={values[f.key] ?? ""}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    className="resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={values[f.key] ?? ""}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </label>
            );
          })}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              {error}
            </p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="primary" loading={busy}>
              {submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}