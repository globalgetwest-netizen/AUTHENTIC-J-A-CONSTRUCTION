"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DOCUMENT_STATUSES,
  formatBytes,
  formatDateTime,
  formatDate,
  label,
  type DocumentAccessRow,
  type DocumentMeta,
} from "@/lib/admin/types";

const inputClass = "w-full sm:w-auto rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function DetailRow({ label: lab, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center">
      <dt className="shrink-0 text-sm font-medium text-neutral-500 sm:w-40">{lab}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.zip";

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // New-version form
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionUrl, setVersionUrl] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [versionBusy, setVersionBusy] = useState(false);

  // Access-grant form
  const [principalType, setPrincipalType] = useState<DocumentAccessRow["principalType"]>("USER");
  const [principalId, setPrincipalId] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("VIEW");
  const [grantBusy, setGrantBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/admin/documents/${id}`, { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as (DocumentMeta & { message?: string }) | null;
      if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this document.");
      setDoc(body);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/documents/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as (DocumentMeta & { message?: string }) | null;
        if (!res.ok || !body || !body.id) throw new Error(body?.message ?? "Could not load this document.");
        return body;
      })
      .then((record) => {
        if (!cancelled) {
          setDoc(record);
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

  async function addVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!versionFile && !versionUrl.trim()) {
      setMessage("Choose a file to upload or paste a link.");
      return;
    }
    setVersionBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      if (versionFile) form.set("file", versionFile);
      if (versionUrl.trim()) form.set("url", versionUrl.trim());
      if (versionNote.trim()) form.set("note", versionNote.trim());
      const res = await fetch(`/api/admin/documents/${id}/versions`, { method: "POST", body: form });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not add the version.");
      setVersionFile(null);
      setVersionUrl("");
      setVersionNote("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not add the version.");
    } finally {
      setVersionBusy(false);
    }
  }

  async function changeStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!doc || !next) return;
    setMessage("");
    const res = await fetch(`/api/admin/documents/${doc.id}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not update the status.");
      return;
    }
    await load();
  }

  async function grantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!principalId.trim()) return setMessage("Enter the principal ID to grant access to.");
    setGrantBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/documents/${id}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ principalType, principalId: principalId.trim(), permission }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not grant access.");
      setPrincipalId("");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not grant access.");
    } finally {
      setGrantBusy(false);
    }
  }

  async function revoke(row: DocumentAccessRow) {
    if (!doc) return;
    if (!window.confirm(`Revoke ${row.principalType} access for principal “${row.principalId}”?`)) return;
    setMessage("");
    const res = await fetch(
      `/api/admin/documents/${doc.id}/access/${row.principalType}/${row.principalId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not revoke access.");
      return;
    }
    await load();
  }

  async function remove() {
    if (!doc) return;
    if (!window.confirm(`Delete “${doc.title}”?`)) return;
    setMessage("");
    const res = await fetch(`/api/admin/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setMessage(body?.message ?? "Could not delete this document.");
      return;
    }
    router.push("/admin/documents");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <Link href="/admin/documents" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
          ← Back to documents
        </Link>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || "Document not found."}
        </p>
      </div>
    );
  }

  const isLink = !doc.fileUrl.startsWith("/uploads");

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/documents" className="inline-block text-sm font-semibold text-brand-blue hover:underline">
        ← Back to documents
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{doc.title}</h1>
          <p className="text-sm text-neutral-500">
            {doc.category ? label(doc.category) : "Uncategorised"} · updated {formatDate(doc.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLink ? (
            <a
              href={`/api/admin/documents/${doc.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Open file
            </a>
          ) : (
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Open link
            </a>
          )}
          <Button variant="danger" onClick={remove}>Delete</Button>
        </div>
      </div>

      {message && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-2">
        <dl className="divide-y divide-neutral-100">
          <DetailRow label="Status">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={doc.status} />
              <select className={inputClass} value={doc.status} onChange={changeStatus}>
                {DOCUMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{label(s)}</option>
                ))}
              </select>
            </div>
          </DetailRow>
          <DetailRow label="Access level">
            <StatusBadge value={doc.accessLevel} />
          </DetailRow>
          <DetailRow label="Uploaded by">{doc.uploaderName || "—"}</DetailRow>
          <DetailRow label="File">{isLink ? "External URL" : formatBytes(doc.sizeBytes)}</DetailRow>
          <DetailRow label="Created">{formatDateTime(doc.createdAt)}</DetailRow>
          {doc.entity && (
            <DetailRow label="Related">
              {label(doc.entity)}
              {doc.entityId ? ` · ${doc.entityId}` : ""}
            </DetailRow>
          )}
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Version history</h2>
        {doc.versions && doc.versions.length > 0 ? (
          <div className="space-y-2">
            {doc.versions.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div>
                  <span className="text-sm font-semibold text-neutral-900">v{v.version}</span>
                  {v.note && <span className="ml-2 text-sm text-neutral-600">{v.note}</span>}
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {formatDateTime(v.createdAt)} · {v.uploaderName || "—"} · {isLink ? "external" : formatBytes(v.sizeBytes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No versions recorded.</p>
        )}

        <form onSubmit={addVersion} className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
          <h3 className="text-sm font-semibold text-neutral-900">Add a new version</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Upload file</span>
              <input
                type="file"
                accept={ACCEPT}
                onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600"
              />
            </label>
            <label className="block">
              <span className={labelClass}>…or link</span>
              <input
                className={`w-full ${inputClass}`}
                value={versionUrl}
                onChange={(e) => setVersionUrl(e.target.value)}
                placeholder="https://…"
                maxLength={1000}
              />
            </label>
          </div>
          <div>
            <label className={labelClass} htmlFor="ver-note">Change note (optional)</label>
            <input
              id="ver-note"
              className={`w-full ${inputClass}`}
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="What changed in this revision?"
              maxLength={500}
            />
          </div>
          <Button type="submit" loading={versionBusy}>Add version</Button>
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Access control</h2>
        {doc.access && doc.access.length > 0 ? (
          <div className="space-y-2">
            {doc.access.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-neutral-900">{label(row.principalType)}</span>
                  <span className="text-neutral-600">{row.principalId}</span>
                  <span className="rounded-md bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    {row.permission}
                  </span>
                </div>
                <button type="button" onClick={() => revoke(row)} className="text-sm font-semibold text-red-600 hover:underline">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No explicit grants — visibility follows the access level.</p>
        )}

        <form onSubmit={grantAccess} className="mt-5 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-5">
          <label className="block">
            <span className={labelClass}>Principal type</span>
            <select className={inputClass} value={principalType} onChange={(e) => setPrincipalType(e.target.value as DocumentAccessRow["principalType"])}>
              <option value="CLIENT">Client</option>
              <option value="STAFF">Staff</option>
              <option value="ROLE">Role</option>
              <option value="USER">User</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Principal ID</span>
            <input className={inputClass} value={principalId} onChange={(e) => setPrincipalId(e.target.value)} placeholder="UUID or role name" />
          </label>
          <label className="block">
            <span className={labelClass}>Permission</span>
            <select className={inputClass} value={permission} onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}>
              <option value="VIEW">View</option>
              <option value="EDIT">Edit</option>
            </select>
          </label>
          <Button type="submit" loading={grantBusy}>Grant</Button>
        </form>
      </div>
    </div>
  );
}