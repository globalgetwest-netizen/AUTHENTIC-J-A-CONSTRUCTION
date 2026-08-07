"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@ajac/ui";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";

type Row = { id: string; code: string; primary: string; extra: string; count: number };

export function OrgPanel<R extends { id: string }>({
  title,
  api,
  primaryLabel,
  extraLabel,
  toPrimary,
  toExtra = () => "",
  toCount = () => 0,
  buildBody,
}: {
  title: string;
  api: string;
  primaryLabel: string;
  extraLabel?: string;
  toPrimary: (record: R) => string;
  toExtra?: (record: R) => string;
  toCount?: (record: R) => number;
  buildBody: (primary: string, extra: string) => Record<string, unknown>;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [primary, setPrimary] = useState("");
  const [extra, setExtra] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrimary, setEditPrimary] = useState("");
  const [editExtra, setEditExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`${api}?pageSize=100`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: R[]; message?: string } | null;
        if (!res.ok || !body) throw new Error(body?.message ?? "Could not load.");
        if (!cancelled) {
          setRows(
            (body.data ?? []).map((r) => ({
              id: r.id,
              code: "code" in r ? String((r as Record<string, unknown>).code) : "",
              primary: toPrimary(r),
              extra: toExtra(r),
              count: toCount(r),
            })),
          );
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
  }, [api, toPrimary, toExtra, toCount, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!primary.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildBody(primary.trim(), extra.trim())),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not create.");
      setPrimary("");
      setExtra("");
      reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(row: Row) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`${api}/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildBody(editPrimary.trim(), editExtra.trim())),
      });
      const body = (await res.json().catch(() => null)) as { message?: string };
      if (!res.ok) throw new Error(body?.message ?? "Could not save.");
      setEditingId(null);
      reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete ${row.primary}? This cannot be undone.`)) return;
    await fetch(`${api}/${row.id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-900">
        {title}
      </div>

      <div className="border-b border-neutral-100 px-5 py-3">
        <form onSubmit={create} className="flex flex-wrap items-center gap-2">
          <input
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            placeholder={`New ${primaryLabel.toLowerCase()}…`}
            className={`${inputClass} w-56`}
          />
          {extraLabel && (
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder={`${extraLabel} (optional)…`}
              className={`${inputClass} w-48`}
            />
          )}
          <Button type="submit" loading={busy}>
            Add
          </Button>
        </form>
      </div>

      {error && (
        <p className="border-b border-neutral-100 px-5 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-neutral-500">
          Nothing here yet — add the first one above.
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <tr key={row.id}>
                {editingId === row.id ? (
                  <td colSpan={3} className="px-5 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={editPrimary}
                        onChange={(e) => setEditPrimary(e.target.value)}
                        className={`${inputClass} w-56`}
                      />
                      {extraLabel && (
                        <input
                          value={editExtra}
                          onChange={(e) => setEditExtra(e.target.value)}
                          className={`${inputClass} w-48`}
                        />
                      )}
                      <Button size="sm" onClick={() => saveEdit(row)} loading={busy}>
                        Save
                      </Button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-neutral-900">{row.primary}</div>
                      <div className="text-xs text-neutral-500">{row.extra}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-neutral-500">{row.code}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="mr-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        {row.count}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setEditPrimary(row.primary);
                          setEditExtra(row.extra);
                        }}
                        className="mr-3 text-sm font-semibold text-brand-blue hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {message && (
        <div className="border-t border-neutral-100 px-5 py-2 text-xs text-neutral-600">{message}</div>
      )}
    </div>
  );
}
