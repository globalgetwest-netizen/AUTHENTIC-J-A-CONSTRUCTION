"use client";

import type { EmployeeIdRef, EmployeeIdType } from "@/lib/admin/types";

export const ID_TYPE_THEME: Record<
  EmployeeIdType,
  { header: string; accent: string; label: string; tier: string }
> = {
  CEO: { header: "#14324F", accent: "#C2A15B", label: "CEO & Founder", tier: "Executive Identity Card" },
  ADMIN: { header: "#14324F", accent: "#C2A15B", label: "Administrator", tier: "Admin Identity Card" },
  STAFF: { header: "#0047AB", accent: "#0047AB", label: "Staff", tier: "Staff Identity Card" },
  WORKER: { header: "#00A651", accent: "#00A651", label: "Worker", tier: "Worker Identity Card" },
};

export interface EmployeeIdCardPreviewProps {
  idType: EmployeeIdType;
  employee?: EmployeeIdRef | null;
  photoUrl?: string | null;
  holderName?: string | null;
  holderPosition?: string | null;
  holderDepartment?: string | null;
  holderCode?: string | null;
  cardNumber?: string;
  issuedAt?: string;
  expiresAt?: string | null;
  status?: string;
  /** Width in px the card renders at (preserves the 242×152 ratio). */
  scale?: number;
}

/**
 * Live, browser-rendered preview of the ID card — mirrors the @react-pdf
 * `EmployeeIdCardTemplate` so what the admin sees is what the PDF contains.
 */
export function EmployeeIdCardPreview(props: EmployeeIdCardPreviewProps) {
  const {
    idType,
    employee,
    photoUrl,
    holderName,
    holderPosition,
    holderDepartment,
    holderCode,
    cardNumber = "AJAC-EID-000000",
    issuedAt = "—",
    expiresAt,
    status = "VERIFIED",
    scale = 320,
  } = props;

  const theme = ID_TYPE_THEME[idType];
  const ratio = 152 / 242;
  const w = scale;
  const h = Math.round(scale * ratio);

  const name = employee
    ? [employee.firstName, employee.lastName].filter(Boolean).join(" ")
    : (holderName ?? "—");
  const initials = name
    .split(/\s+/)
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const position = employee?.position?.title ?? holderPosition ?? "—";
  const department = employee?.department?.name ?? holderDepartment ?? "";
  const code = employee?.employeeCode ?? holderCode ?? "—";

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        overflow: "hidden",
        border: `1.5px solid ${theme.accent}`,
        background: "#fff",
        position: "relative",
        boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: theme.header,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local brand asset */}
        <img
          src="/brand/aja-logo-clean.png"
          alt="AUTHENTIC J.A. logo"
          style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 3 }}
        />
        <div style={{ flex: 1, lineHeight: 1.1 }}>
          <div style={{ color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>
            AUTHENTIC J.A. CONSTRUCTION LTD.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 6,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginTop: 1,
            }}
          >
            {theme.tier}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.18)",
            borderRadius: 3,
            padding: "2px 6px",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 6,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {theme.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, padding: "10px 12px", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              border: `1px solid ${theme.accent}`,
              background: "#FAF5EA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local/object photo
              <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 15, fontWeight: 700, color: theme.accent }}>{initials}</span>
            )}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#26303B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <div style={{ fontSize: 7, color: "#5B6674", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {position}
            {department ? ` · ${department}` : ""}
          </div>
          <div style={{ marginTop: 6, fontSize: 7 }}>
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{ width: 56, color: "#5B6674", textTransform: "uppercase" }}>Staff code</span>
              <span style={{ flex: 1, color: "#26303B", fontWeight: 600 }}>{code}</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
              <span style={{ width: 56, color: "#5B6674", textTransform: "uppercase" }}>Card no.</span>
              <span style={{ flex: 1, color: "#26303B", fontWeight: 600 }}>{cardNumber}</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
              <span style={{ width: 56, color: "#5B6674", textTransform: "uppercase" }}>Issued</span>
              <span style={{ flex: 1, color: "#26303B", fontWeight: 600 }}>{issuedAt}</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 1 }}>
              <span style={{ width: 56, color: "#5B6674", textTransform: "uppercase" }}>Expires</span>
              <span style={{ flex: 1, color: "#26303B", fontWeight: 600 }}>
                {expiresAt ? expiresAt : "No expiry"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ width: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 6,
              border: "1px solid #DAD0B8",
              background:
                "repeating-conic-gradient(#26303B 0% 25%, #fff 0% 50%) 50% / 8px 8px",
            }}
          />
          <div style={{ fontSize: 6, color: "#5B6674", marginTop: 3, textAlign: "center" }}>Scan to verify</div>
        </div>
      </div>

      {/* Status band */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: theme.header,
          padding: "3px 12px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#fff", fontSize: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Authentic J.A. Construction Limited
        </span>
        <span style={{ color: "#fff", fontSize: 6, textTransform: "uppercase" }}>{status}</span>
      </div>
    </div>
  );
}
