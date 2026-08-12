"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  EMPLOYEE_ID_TYPES,
  type Employee,
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

/**
 * Issue a professional ID card. The card can be linked to an existing employee
 * or created standalone (a one-off CEO/Admin/Worker pass) from the holder
 * fields. A live preview mirrors the generated PDF exactly.
 */
export function EmployeeIdIssueForm() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [idType, setIdType] = useState<EmployeeIdType>("STAFF");
  const [linkEmployee, setLinkEmployee] = useState(true);
  const [employeeId, setEmployeeId] = useState("");
  const [holderName, setHolderName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/employees?pageSize=100", { cache: "no-store" })
      .then((r) => r.json().catch(() => null))
      .then((body) => {
        if (cancelled) return;
        const list = (body as { data?: Employee[] } | null)?.data;
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        /* Options list is a convenience; the form still works without it. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === employeeId) ?? null,
    [employees, employeeId],
  );

  // Live preview source: linked employee drives name/photo when present.
  const previewName = linkEmployee ? selectedEmployee?.firstName + " " + selectedEmployee?.lastName : holderName;
  const previewPosition = linkEmployee ? selectedEmployee?.position?.title : position;
  const previewDepartment = linkEmployee ? selectedEmployee?.department?.name : department;
  const previewCode = linkEmployee ? (selectedEmployee?.employeeCode ?? "—") : "—";

  function onPhotoSelected(file: File | null) {
    setPhotoFile(file);
    setPhotoUrl(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

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
      if (linkEmployee && !employeeId) {
        throw new Error("Select the employee to issue a card for.");
      }
      if (!linkEmployee && !holderName.trim()) {
        throw new Error("Enter the holder's full name.");
      }
      const uploaded = photoFile ? await uploadPhoto() : null;

      const res = await fetch("/api/admin/employee-ids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idType,
          ...(linkEmployee && employeeId ? { employeeId } : {}),
          ...(!linkEmployee
            ? {
                holderName: holderName.trim() || null,
                position: position.trim() || null,
                department: department.trim() || null,
                contactPhone: contactPhone.trim() || null,
                contactEmail: contactEmail.trim() || null,
              }
            : {}),
          ...(uploaded ? { photoUrl: uploaded } : {}),
          ...(expiresAt ? { expiresAt } : {}),
        }),
      });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not issue the ID card.");
      const id = body?.id;
      if (id) {
        router.push(`/admin/employee-ids/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue the ID card.");
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

        {/* ID category/type */}
        <div>
          <span className={labelClass}>ID category / type *</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EMPLOYEE_ID_TYPES.map((t) => {
              const active = idType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setIdType(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-blue"
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            The selected type sets the card's colour treatment and title (CEO, Admin, Staff or Worker).
          </p>
        </div>

        {/* Link mode */}
        <fieldset className="rounded-lg border border-neutral-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Card holder
          </legend>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                checked={linkEmployee}
                onChange={() => setLinkEmployee(true)}
              />
              Existing employee
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="radio"
                checked={!linkEmployee}
                onChange={() => setLinkEmployee(false)}
              />
              Standalone (CEO / Admin / Worker)
            </label>
          </div>

          {linkEmployee ? (
            <div className="mt-3">
              <label className={labelClass} htmlFor="eid-employee">
                Employee *
              </label>
              <select
                id="eid-employee"
                className={inputClass}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Select an employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="eid-name">
                  Full name *
                </label>
                <input
                  id="eid-name"
                  className={inputClass}
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Joseph Acquah"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="eid-pos">
                  Position / role
                </label>
                <input
                  id="eid-pos"
                  className={inputClass}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Chief Executive Officer"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="eid-dept">
                  Department
                </label>
                <input
                  id="eid-dept"
                  className={inputClass}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Executive"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="eid-phone">
                  Contact phone
                </label>
                <input
                  id="eid-phone"
                  className={inputClass}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="eid-email">
                  Contact email
                </label>
                <input
                  id="eid-email"
                  type="email"
                  className={inputClass}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* Photo */}
        <div>
          <label className={labelClass} htmlFor="eid-photo">
            Photograph
          </label>
          <input
            id="eid-photo"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
            onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-neutral-500">
            A headshot shown on the card. Optional — initials are used when none is supplied.
          </p>
        </div>

        {/* Expiry */}
        <div>
          <label className={labelClass} htmlFor="eid-expires">
            Expiry date (optional)
          </label>
          <input
            id="eid-expires"
            type="date"
            className={inputClass}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">Leave blank for a card that never expires.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy}>Issue & generate ID</Button>
          <Link
            href="/admin/employee-ids"
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className={labelClass + " mb-3"}>Live preview</p>
        <div className="flex justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <EmployeeIdCardPreview
            idType={idType}
            employee={linkEmployee ? selectedEmployee : null}
            photoUrl={photoPreview}
            holderName={linkEmployee ? null : (holderName || null)}
            holderPosition={previewPosition ?? null}
            holderDepartment={previewDepartment ?? null}
            holderCode={previewCode}
            cardNumber="AJAC-EID-000000"
            issuedAt={new Date().toISOString().slice(0, 10)}
            expiresAt={expiresAt || null}
            status="VERIFIED"
            scale={280}
          />
        </div>
        <p className="mt-2 text-center text-xs text-neutral-500">
          The generated PDF matches this preview exactly.
        </p>
      </div>
    </div>
  );
}
