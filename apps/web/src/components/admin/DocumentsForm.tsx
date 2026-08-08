"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import { ACCESS_LEVELS, label } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";
const CATEGORIES = ["contracts", "plans", "reports", "safety", "permits", "financial", "other"];
const ENTITIES = ["PROJECT", "PROPERTY", "CLIENT", "SUPPLIER", "INVOICE", "PAYSLIP"];

/**
 * Upload a new document. Two mutually exclusive sources: an uploaded file
 * (multipart) or an external URL. The `file` field wins when both are given.
 */
export function DocumentUploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [entity, setEntity] = useState("");
  const [entityId, setEntityId] = useState("");
  const [accessLevel, setAccessLevel] = useState("INTERNAL");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Give the document a title.");
    const file = fileRef.current?.files?.[0];
    if (!file && !url.trim()) return setError("Choose a file to upload or paste a URL.");

    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("title", title.trim());
      if (category) form.set("category", category);
      if (entity) form.set("entity", entity);
      if (entityId.trim()) form.set("entityId", entityId.trim());
      form.set("accessLevel", accessLevel);
      if (url.trim()) form.set("url", url.trim());
      if (file) form.set("file", file);

      const res = await fetch("/api/admin/documents", { method: "POST", body: form });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok || !body?.id) throw new Error(body?.message ?? "Could not upload the document.");
      router.push(`/admin/documents/${body.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div>
        <label className={labelClass} htmlFor="doc-title">
          Title *
        </label>
        <input
          id="doc-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bank guarantee — Phase 2"
          maxLength={200}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="doc-category">
            Category
          </label>
          <select
            id="doc-category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Uncategorised</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {label(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="doc-access">
            Access level *
          </label>
          <select
            id="doc-access"
            className={inputClass}
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value)}
          >
            {ACCESS_LEVELS.map((a) => (
              <option key={a} value={a}>
                {label(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="doc-entity">
            Related to (kind)
          </label>
          <select
            id="doc-entity"
            className={inputClass}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">—</option>
            {ENTITIES.map((en) => (
              <option key={en} value={en}>
                {label(en)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="doc-entity-id">
            Related record ID (optional)
          </label>
          <input
            id="doc-entity-id"
            className={inputClass}
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="UUID"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-file">
          Upload file
        </label>
        <input
          id="doc-file"
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.zip"
          className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600"
        />
        <p className="mt-1 text-xs text-neutral-500">Max 20 MB. PDF, Office, images or archives.</p>
      </div>

      <div>
        <label className={labelClass} htmlFor="doc-url">
          …or link to a file URL
        </label>
        <input
          id="doc-url"
          className={inputClass}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          maxLength={1000}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          Upload document
        </Button>
        <Link
          href="/admin/documents"
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}