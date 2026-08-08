"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, type NotificationRow } from "@/lib/admin/types";
import { StatusBadge } from "./StatusBadge";

/**
 * Notification bell for the admin/staff/client shells. Polls the unread count,
 * fetches the latest notifications on open, and marks items read on click.
 * Self-scoped on the API side — one component for every portal.
 */
export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState<number>(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  async function refreshCount() {
    try {
      const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { totalUnread?: number };
      setUnread(data.totalUnread ?? 0);
    } catch {
      /* offline / signed out — keep the badge as-is */
    }
  }

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?pageSize=12&sortOrder=desc", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: NotificationRow[] };
        setItems(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications/unread-count", { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((data: { totalUnread?: number } | null) => {
        if (!cancelled) setUnread(data?.totalUnread ?? 0);
      })
      .catch(() => undefined);
    const id = window.setInterval(refreshCount, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function openPanel() {
    const next = !open;
    setOpen(next);
    if (next) await loadItems();
  }

  async function openNotification(n: NotificationRow) {
    setOpen(false);
    if (!n.readAt) {
      fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => undefined);
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "POST" });
    if (res.ok) setUnread(0);
    const fresh = items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }));
    setItems(fresh);
  }

  const icon = (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={openPanel}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
      >
        {icon}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-neutral-800">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">
                You&apos;re all caught up.
              </div>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`block w-full border-b border-neutral-50 px-4 py-3 text-left transition hover:bg-neutral-50 ${
                    n.readAt ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-neutral-800">
                      {n.title}
                    </span>
                    <span className="shrink-0">
                      <StatusBadge value={n.type} />
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{n.body}</p>
                  )}
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {formatDateTime(n.createdAt)}
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}