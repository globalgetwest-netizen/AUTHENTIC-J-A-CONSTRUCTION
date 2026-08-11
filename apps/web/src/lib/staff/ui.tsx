import { useEffect, useState, type ReactNode } from "react";

/** Shared form control styling for the staff work pages (matches the admin console). */
export const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
export const labelClass = "block text-sm font-medium text-neutral-700";

/** A labelled form field inside a 2-column grid; `span` makes it full width. */
export function Field({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? "sm:col-span-2" : undefined}>
      <label className={labelClass}>{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Tracks form submission state and surfaces server errors. */
export function formError(res: Response, body: { message?: string } | null): string {
  if (!res.ok) return body?.message ?? "Could not save. Try again.";
  return "";
}

/**
 * Loads a paginated staff catalogue (proxy path) into a flat option list for
 * form dropdowns, e.g. useCatalog<Warehouse>("/api/staff/warehouses").
 */
export function useCatalog<T>(path: string): T[] {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(path, { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((b) => {
        if (!cancelled) setItems((b?.data ?? []) as T[]);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return items;
}

/** Whether the signed-in staff member is the head of their department. */
export function useIsDepartmentHead(): boolean {
  const [isHead, setIsHead] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/profile", { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((b) => {
        if (cancelled) return;
        const emp = b?.employee;
        const dept = emp?.department;
        setIsHead(Boolean(emp && dept?.headId && dept.headId === emp.id));
      })
      .catch(() => {
        if (!cancelled) setIsHead(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return isHead;
}
