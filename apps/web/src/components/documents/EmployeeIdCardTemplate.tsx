import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EmployeeIdRef, EmployeeIdType } from "@/lib/admin/types";
import { idFullName } from "@/lib/admin/types";
import { dateLabel } from "@/lib/documents/format";
import { DOC_COLORS as C } from "./Letterhead";

// Card dimensions (landscape credit-card, readable at 100%): 242 x 152 pt.
const CARD_W = 242;
const CARD_H = 152;

// Distinct visual treatment per corporate ID tier. CEO = gold on navy,
// Admin = navy on slate, Staff = corporate blue, Worker = green.
const TYPE_THEME: Record<
  EmployeeIdType,
  { header: string; accent: string; band: string; label: string; tier: string }
> = {
  CEO: { header: C.navy, accent: C.gold, band: C.navy, label: "CEO & Founder", tier: "Executive Identity Card" },
  ADMIN: { header: "#14324F", accent: "#C2A15B", band: "#14324F", label: "Administrator", tier: "Admin Identity Card" },
  STAFF: { header: C.blue, accent: C.blue, band: C.blue, label: "Staff", tier: "Staff Identity Card" },
  WORKER: { header: C.green, accent: C.green, band: C.green, label: "Worker", tier: "Worker Identity Card" },
};

const styles = StyleSheet.create({
  page: { width: CARD_W, height: CARD_H, backgroundColor: "#ffffff" },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderWidth: 1.2,
    borderColor: C.blue,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  header: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 22, height: 22, marginRight: 7, objectFit: "contain" },
  headerText: { flex: 1 },
  company: { color: "#ffffff", fontSize: 9, fontWeight: "bold", letterSpacing: 0.5 },
  subtitle: { color: "#ffffff", fontSize: 5.5, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 1, opacity: 0.85 },
  typeChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  typeChipText: { color: "#ffffff", fontSize: 5.5, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 },
  body: { flexDirection: "row", paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6 },
  left: { flex: 1, paddingRight: 8 },
  photo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  name: { fontSize: 11, fontWeight: "bold", color: C.charcoal },
  code: { fontSize: 6.5, color: C.muted, marginTop: 1 },
  meta: { marginTop: 6 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaKey: { width: 46, fontSize: 6, color: C.muted, textTransform: "uppercase" },
  metaVal: { flex: 1, fontSize: 7, color: C.charcoal, fontWeight: 600 },
  right: { alignItems: "center", justifyContent: "space-between", width: 64 },
  qrBox: { alignItems: "center" },
  qr: { width: 52, height: 52 },
  qrCaption: { fontSize: 5.5, color: C.muted, marginTop: 2, textAlign: "center" },
  statusBand: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { color: "#ffffff", fontSize: 5.5, textTransform: "uppercase" },
});

export interface EmployeeIdCardTemplateProps {
  logoSrc: string | null;
  employee?: EmployeeIdRef | null;
  photoSrc?: string | null;
  cardNumber: string;
  qrSrc: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  status: string;
  idType?: EmployeeIdType;
  holderName?: string | null;
  holderPosition?: string | null;
  holderDepartment?: string | null;
  holderEmployeeCode?: string | null;
}

export function EmployeeIdCardTemplate(props: EmployeeIdCardTemplateProps) {
  const {
    logoSrc,
    employee,
    photoSrc,
    cardNumber,
    qrSrc,
    issuedAt,
    expiresAt,
    status,
    idType = "STAFF",
    holderName,
    holderPosition,
    holderDepartment,
    holderEmployeeCode,
  } = props;

  const theme = TYPE_THEME[idType];
  const name = employee ? idFullName(employee) : (holderName ?? "—");
  const initials = name
    .split(/\s+/)
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const position = employee?.position?.title ?? holderPosition ?? "—";
  const department = employee?.department?.name ?? holderDepartment ?? "";
  const employeeCode = employee?.employeeCode ?? holderEmployeeCode ?? "—";

  return (
    <Document>
      <Page size={{ width: CARD_W, height: CARD_H }} style={styles.page}>
        <View style={[styles.card, { borderColor: theme.accent }]}>
          <View style={[styles.header, { backgroundColor: theme.header }]}>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support
              <Image src={logoSrc} style={styles.logo} />
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.company}>AUTHENTIC J.A. CONSTRUCTION LTD.</Text>
              <Text style={styles.subtitle}>{theme.tier}</Text>
            </View>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{theme.label}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.left}>
              <View style={[styles.photo, { borderColor: theme.accent }]}>
                {photoSrc ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support
                  <Image src={photoSrc} style={styles.photoImg} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: theme.accent }}>{initials}</Text>
                )}
              </View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.code}>
                {position}
                {department ? ` · ${department}` : ""}
              </Text>

              <View style={styles.meta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Staff code</Text>
                  <Text style={styles.metaVal}>{employeeCode}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Card no.</Text>
                  <Text style={styles.metaVal}>{cardNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Issued</Text>
                  <Text style={styles.metaVal}>{dateLabel(issuedAt)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Expires</Text>
                  <Text style={styles.metaVal}>{expiresAt ? dateLabel(expiresAt) : "No expiry"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.right}>
              {qrSrc ? (
                <View style={styles.qrBox}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
                  <Image src={qrSrc} style={styles.qr} />
                  <Text style={styles.qrCaption}>Scan to verify</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.statusBand, { backgroundColor: theme.band }]}>
            <Text style={styles.statusText}>Authentic J.A. Construction Limited</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
