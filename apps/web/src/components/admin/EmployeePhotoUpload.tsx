"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";

const inputClass =
  "block w-full cursor-pointer rounded-md border border-neutral-300 bg-white text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:opacity-90";

interface EmployeePhotoUploadProps {
  employeeId: string;
  /** Stored photo path (e.g. `/uploads/employees/x.jpg`) or null when unset. */
  photoUrl?: string | null;
  /** Employee initials, used for the empty-state placeholder. */
  initials: string;
}

/**
 * Worker headshot management: previews the current photo, lets an admin upload
 * a replacement (multipart POST forwarded to the API, which stores it under
 * uploads/employees). The photo flows onto the employee ID card and worker
 * certificate.
 */
export function EmployeePhotoUpload({ employeeId, photoUrl, initials }: EmployeePhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Local preview of the newly-selected file.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function upload() {
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch(`/api/admin/employees/${employeeId}/photo`, {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not upload the photo.");
      setMessage("Photo saved. It now appears on the ID card and worker certificate.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  const src = preview || (photoUrl ? `/api/admin/employees/${employeeId}/photo` : "");

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-neutral-200 bg-white px-5 py-5">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-blue bg-neutral-100">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local proxy stream, not remote
          <img src={src} alt="Worker headshot" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-brand-blue">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Worker photo</p>
          <p className="text-xs text-neutral-500">
            A clear, front-facing headshot (JPG or PNG, up to 5 MB). Shown on the employee ID
            card and worker certificate.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={inputClass}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}
        {file && (
          <Button type="button" onClick={upload} loading={busy}>
            {busy ? "Uploading…" : "Save photo"}
          </Button>
        )}
      </div>
    </div>
  );
}
