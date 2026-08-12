"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  EMPLOYEE_ID_TYPES,
  type EmployeeIdCard,
  type EmployeeIdType,
} from "@/lib/admin/types";
import { EmployeeIdCardPreview } from "@/components/documents/EmployeeIdCardPreview";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

const TYPE_LABELS: Record<EmployeeIdType, string> = {
  CEO: "CEO & Founder",
  ADMIN: "Administrator",
  STAFF: "Staff",
  WORKER: "Worker",
};

/** Edit an existing card: type, holder details, photo and expiry. */
export function EmployeeIdEditForm({ card }: { card: EmployeeIdCard }) {
  const router = useRouter();

  const [idType, setIdType] = useState<EmployeeIdType>(card.idType);
  const [holderName, setHolderName] = useState(card.holderName ?? "");
  const [position, setPosition] = useState(card.position ?? "");
  const [department, setDepartment] = useState(card.department ?? "");
  const [contactPhone, setContactPhone] = useState(card.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(card.contactEmail ?? "");
  const [expiresAt, setExpiresAt] = useState(card.expiresAt?.slice(0, 10) ?? "");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(card.photoUrl ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append("photo", photoFile);
    const res = await fetch("/api/admin/employee-ids/photo", { method: "POST", body: fd });
    const body = (await res.json().catch(() => null)) as { photoUrl?: string; message?: string } | null;
    if (!res.ok || !body?.photoUrl) throw new Error(body?.message ?? "Could not upload the photo.");
    return body.photoUrl;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const uploaded = photoFile ? await uploadPhoto() : null;

      const res = await fetch(`/api/admin/employee-ids/${card.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idType,
          holderName: holderName.trim() || null,
          position: position.trim() || null,
          department: department.trim() || null,
          contactPhone: contactPhone.trim() || null,
          contactEmail: contactEmail.trim() || null,
          ...(uploaded ? { photoUrl: uploaded } : {}),
          ...(expiresAt ? { expiresAt } : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not update the ID card.");

      router.push(`/admin/employee-ids/${card.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the ID card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        <div>
          <span className={labelClass}>ID category / type</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EMPLOYEE_ID_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setIdType(t)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  idType === t
                    ? "border-brand-blue bg-brand-blue text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-blue"
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="eid-name">Full name *</label>
            <input id="eid-name" className={inputClass} value={holderName} onChange={(e) => setHolderName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eid-pos">Position / role</label>
            <input id="eid-pos" className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eid-dept">Department</label>
            <input id="eid-dept" className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eid-phone">Contact phone</label>
            <input id="eid-phone" className={inputClass} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="eid-email">Contact email</label>
            <input id="eid-email" type="email" className={inputClass} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="eid-photo">Photograph</label>
          <input
            id="eid-photo"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhotoFile(file);
              setPhotoPreview(file ? URL.createObjectURL(file) : card.photoUrl ?? null);
            }}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="eid-expires">Expiry date</label>
          <input id="eid-expires" type="date" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy}>Save changes</Button>
        </div>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className={labelClass + " mb-3"}>Live preview</p>
        <div className="flex justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <EmployeeIdCardPreview
            idType={idType}
            employee={card.employee}
            photoUrl={photoPreview}
            holderName={holderName || null}
            holderPosition={position || null}
            holderDepartment={department || null}
            holderCode={card.employee?.employeeCode ?? "—"}
            cardNumber={card.cardNumber}
            issuedAt={card.issuedAt.slice(0, 10)}
            expiresAt={expiresAt || null}
            status={card.status}
            scale={280}
          />
        </div>
      </div>
    </div>
  );
}
