"use client";

import { useCallback, useEffect, useState } from "react";
import type { Paginated, PaginationMeta } from "./types";

const EMPTY_META: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

/** Fetch a paginated admin list from a route handler, refetching on param change. */
export function useList<T>(path: string, params: Record<string, string | undefined>) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const query = qs.toString();
  const url = `${path}${query ? `?${query}` : ""}`;

  useEffect(() => {
    let cancelled = false;
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | (Paginated<T> & { message?: string })
          | null;
        if (!res.ok || !body || !body.meta) throw new Error(body?.message ?? "Failed to load.");
        if (!cancelled) {
          setData(body.data);
          setMeta(body.meta);
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
  }, [url, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, meta, loading, error, reload };
}