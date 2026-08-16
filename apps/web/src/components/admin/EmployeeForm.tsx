"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ajac/ui";
import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  JOB_CATEGORIES,
  label,
  type CompanyBranch,
  type Department,
  type Employee,
  type Position,
} from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

function toDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function EmployeeForm({
  initial = null,
  employeeId = null,
}: {
  initial?: Employee | null;
  employeeId?: string | null;
}) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [otherNames, setOtherNames] = useState(initial?.otherNames ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(toDate(initial?.dateOfBirth));
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [placeOfBirth, setPlaceOfBirth] = useState(initial?.placeOfBirth ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? "");
  const [positionId, setPositionId] = useState(initial?.positionId ?? "");
  const [branchId, setBranchId] = useState(initial?.branchId ?? "");
  const [jobCategory, setJobCategory] = useState<string>(initial?.jobCategory ?? "");
  const [employmentType, setEmploymentType] = useState<string>(
    initial?.employmentType ?? "FULL_TIME",
  );
  const [hireDate, setHireDate] = useState(toDate(initial?.hireDate));
  const [terminationDate, setTerminationDate] = useState(toDate(initial?.terminationDate));
  const [contractStart, setContractStart] = useState(toDate(initial?.contractStart));
  const [contractEnd, setContractEnd] = useState(toDate(initial?.contractEnd));
  const [status, setStatus] = useState<string>(initial?.status ?? "ACTIVE");
  const [salary, setSalary] = useState(initial ? String(Number(initial.salary) || 0) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/departments?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/positions?pageSize=100", { cache: "no-store" }),
      fetch("/api/admin/branches?pageSize=100", { cache: "no-store" }),
    ])
      .then(async ([dr, pr, br]) => {
        const dj = (await dr.json().catch(() => null)) as { data?: Department[] } | null;
        const pj = (await pr.json().catch(() => null)) as { data?: Position[] } | null;
        const bj = (await br.json().catch(() => null)) as { data?: CompanyBranch[] } | null;
        if (!cancelled) {
          setDepartments(dj?.data ?? []);
          setPositions(pj?.data ?? []);
          setBranches(bj?.data ?? []);
        }
      })
      .catch(() => {
        // Options lists are convenience; the form still works without them.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!hireDate) {
      setError("A hire date is required.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        employeeId ? `/api/admin/employees/${employeeId}` : "/api/admin/employees",
        {
          method: employeeId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            otherNames: otherNames.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            nationalId: nationalId.trim() || null,
            gender: gender || undefined,
            dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`).toISOString() : null,
            nationality: nationality.trim() || null,
            placeOfBirth: placeOfBirth.trim() || null,
            address: address.trim() || null,
            departmentId: departmentId || null,
            positionId: positionId || null,
            branchId: branchId || null,
            jobCategory: jobCategory || undefined,
            employmentType,
            hireDate: new Date(`${hireDate}T00:00:00`).toISOString(),
            terminationDate: terminationDate
              ? new Date(`${terminationDate}T00:00:00`).toISOString()
              : null,
            contractStart: contractStart
              ? new Date(`${contractStart}T00:00:00`).toISOString()
              : null,
            contractEnd: contractEnd
              ? new Date(`${contractEnd}T00:00:00`).toISOString()
              : null,
            status,
            salary: salary ? Number(salary) : null,
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save employee.");
      const id = body?.id ?? employeeId;
      if (id) {
        router.push(`/admin/employees/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save employee.");
    } finally {
      setBusy(false);
    }
  }

  const selectOptions = (
    list: Array<{ id: string; label: string }>,
    empty: string,
  ) => {
    if (list.length === 0) return null;
    return (
      <>
        <option value="">{empty}</option>
        {list.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </>
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="emp-first">
            First name *
          </label>
          <input
            id="emp-first"
            className={inputClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ama"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-last">
            Last name *
          </label>
          <input
            id="emp-last"
            className={inputClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Owusu"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-other">
            Other names
          </label>
          <input
            id="emp-other"
            className={inputClass}
            value={otherNames}
            onChange={(e) => setOtherNames(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-email">
            Email
          </label>
          <input
            id="emp-email"
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-phone">
            Phone
          </label>
          <input
            id="emp-phone"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+233 …"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-national">
            National ID
          </label>
          <input
            id="emp-national"
            className={inputClass}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-gender">
            Gender
          </label>
          <select
            id="emp-gender"
            className={inputClass}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Not specified</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {label(g)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-dob">
            Date of birth
          </label>
          <input
            id="emp-dob"
            type="date"
            className={inputClass}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-nationality">
            Nationality
          </label>
          <input
            id="emp-nationality"
            className={inputClass}
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Ghanaian"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-pob">
            Place of birth
          </label>
          <input
            id="emp-pob"
            className={inputClass}
            value={placeOfBirth}
            onChange={(e) => setPlaceOfBirth(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="emp-address">
            Address
          </label>
          <input
            id="emp-address"
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="emp-type">
            Employment type
          </label>
          <select
            id="emp-type"
            className={inputClass}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-status">
            Status
          </label>
          <select
            id="emp-status"
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {EMPLOYEE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-department">
            Department
          </label>
          <select
            id="emp-department"
            className={inputClass}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {selectOptions(
              departments.map((d) => ({ id: d.id, label: d.name })),
              "None yet — manage in Org structure",
            ) ?? <option value="">No departments configured</option>}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-position">
            Position
          </label>
          <select
            id="emp-position"
            className={inputClass}
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
          >
            {selectOptions(
              positions.map((p) => ({ id: p.id, label: p.title })),
              "None yet — manage in Org structure",
            ) ?? <option value="">No positions configured</option>}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-jobcat">
            Job category
          </label>
          <select
            id="emp-jobcat"
            className={inputClass}
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
          >
            <option value="">Not specified</option>
            {JOB_CATEGORIES.map((jc) => (
              <option key={jc} value={jc}>
                {label(jc)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-branch">
            Branch
          </label>
          <select
            id="emp-branch"
            className={inputClass}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {selectOptions(
              branches.map((b) => ({ id: b.id, label: b.name })),
              "None yet — manage in Org structure",
            ) ?? <option value="">No branches configured</option>}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-hire">
            Hire date *
          </label>
          <input
            id="emp-hire"
            type="date"
            className={inputClass}
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-term">
            Termination date
          </label>
          <input
            id="emp-term"
            type="date"
            className={inputClass}
            value={terminationDate}
            onChange={(e) => setTerminationDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-contract-start">
            Contract start
          </label>
          <input
            id="emp-contract-start"
            type="date"
            className={inputClass}
            value={contractStart}
            onChange={(e) => setContractStart(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-contract-end">
            Contract end
          </label>
          <input
            id="emp-contract-end"
            type="date"
            className={inputClass}
            value={contractEnd}
            onChange={(e) => setContractEnd(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="emp-salary">
            Salary (GHS, monthly)
          </label>
          <input
            id="emp-salary"
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {employeeId ? "Save changes" : "Create employee"}
        </Button>
        <a
          href={employeeId ? `/admin/employees/${employeeId}` : "/admin/employees"}
          className="text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
