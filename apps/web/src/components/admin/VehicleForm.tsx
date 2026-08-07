"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ajac/ui";
import type { Equipment, Vehicle } from "@/lib/admin/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-blue focus:outline-none";
const labelClass = "block text-sm font-medium text-neutral-700";

export function VehicleForm({ initial = null, equipmentId = "" }: { initial?: Vehicle | null; equipmentId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentIdState, setEquipmentIdState] = useState(initial?.equipmentId ?? equipmentId ?? searchParams.get("equipmentId") ?? "");
  const [registrationNo, setRegistrationNo] = useState(initial?.registrationNo ?? "");
  const [licensePlate, setLicensePlate] = useState(initial?.licensePlate ?? "");
  const [fuelType, setFuelType] = useState(initial?.fuelType ?? "");
  const [insuranceExpiry, setInsuranceExpiry] = useState(initial?.insuranceExpiry ? initial.insuranceExpiry.slice(0, 10) : "");
  const [inspectionDue, setInspectionDue] = useState(initial?.inspectionDue ? initial.inspectionDue.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/equipment?pageSize=100", { cache: "no-store" })
      .then(async (res) => res.json().catch(() => null))
      .then((body) => {
        if (!cancelled && body?.data) setEquipments(body.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!equipmentIdState) return setError("Choose the equipment this vehicle is linked to.");
    if (!registrationNo.trim()) return setError("A registration number is required.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch(initial ? `/api/admin/vehicles/${initial.id}` : "/api/admin/vehicles", {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          equipmentId: equipmentIdState,
          registrationNo: registrationNo.trim(),
          licensePlate: licensePlate.trim() || null,
          fuelType: fuelType.trim() || null,
          insuranceExpiry: insuranceExpiry || null,
          inspectionDue: inspectionDue || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!res.ok) throw new Error(body?.message ?? "Could not save vehicle.");
      const id = body?.id ?? initial?.id;
      if (id) {
        router.push(`/admin/vehicles/${id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vehicle.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="vh-equipment">Equipment *</label>
          <select
            id="vh-equipment"
            className={inputClass}
            value={equipmentIdState}
            onChange={(e) => setEquipmentIdState(e.target.value)}
          >
            <option value="">Select equipment…</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.assetCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="vh-reg">Registration no. *</label>
          <input id="vh-reg" className={inputClass} value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} placeholder="e.g. GW 2345-20" />
        </div>
        <div>
          <label className={labelClass} htmlFor="vh-plate">License plate</label>
          <input id="vh-plate" className={inputClass} value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="vh-fuel">Fuel type</label>
          <input id="vh-fuel" className={inputClass} value={fuelType} onChange={(e) => setFuelType(e.target.value)} placeholder="e.g. DIESEL / PETROL" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="vh-insurance">Insurance expiry</label>
            <input id="vh-insurance" type="date" className={inputClass} value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="vh-inspection">Inspection due</label>
            <input id="vh-inspection" type="date" className={inputClass} value={inspectionDue} onChange={(e) => setInspectionDue(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>{initial ? "Save changes" : "Add vehicle"}</Button>
        <a href={initial ? `/admin/vehicles/${initial.id}` : "/admin/vehicles"} className="text-sm font-semibold text-neutral-500 hover:text-neutral-700">
          Cancel
        </a>
      </div>
    </form>
  );
}