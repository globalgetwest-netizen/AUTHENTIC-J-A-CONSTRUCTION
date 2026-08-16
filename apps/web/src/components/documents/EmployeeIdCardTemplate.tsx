import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EmployeeIdRef, EmployeeIdType } from "@/lib/admin/types";
import { idFullName, label } from "@/lib/admin/types";
import { dateLabel } from "@/lib/documents/format";
import { LETTERHEAD } from "@/config/documents";
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
  backHeader: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  backBody: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    flex: 1,
  },
  backLeft: { flex: 1, paddingRight: 8 },
  backRight: { width: 64, alignItems: "center", justifyContent: "center" },
  backTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  verifyText: { fontSize: 6, color: C.charcoal, lineHeight: 1.3, marginTop: 2 },
  contactRow: { flexDirection: "row", marginTop: 3 },
  contactKey: { width: 38, fontSize: 5.5, color: C.muted, textTransform: "uppercase" },
  contactVal: { flex: 1, fontSize: 6, color: C.charcoal, fontWeight: 600 },
  disclaimer: {
    fontSize: 4.8,
    color: C.muted,
    marginTop: 4,
    lineHeight: 1.25,
    textAlign: "justify",
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
  holderJobCategory?: string | null;
  holderEmployeeCode?: string | null;
  holderContactPhone?: string | null;
  holderContactEmail?: string | null;
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
    holderJobCategory,
    holderEmployeeCode,
    holderContactPhone,
    holderContactEmail,
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
  const jobCategory = employee?.jobCategory ? label(employee.jobCategory) : (holderJobCategory ?? "");
  const employeeCode = employee?.employeeCode ?? holderEmployeeCode ?? "—";

  const contactPhone = employee?.phone ?? holderContactPhone ?? "";
  const contactEmail = employee?.email ?? holderContactEmail ?? "";

  return (
    <Document>
      {/* FRONT */}
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
              {jobCategory ? (
                <Text style={{ fontSize: 6, color: theme.accent, marginTop: 1, fontWeight: 600 }}>
                  {jobCategory}
                </Text>
              ) : null}

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

      {/* BACK */}
      <Page size={{ width: CARD_W, height: CARD_H }} style={styles.page}>
        <View style={[styles.card, { borderColor: theme.accent }]}>
          <View style={[styles.backHeader, { backgroundColor: theme.header }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.backTitle}>Verification & Authorisation</Text>
            </View>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{theme.label}</Text>
            </View>
          </View>

          <View style={styles.backBody}>
            <View style={styles.backLeft}>
              <Text style={styles.verifyText}>
                This card is the property of AUTHENTIC J.A. CONSTRUCTION LIMITED.
                Scan the QR code to verify the holder's identity and current
                employment status in real time.
              </Text>

              <View style={{ marginTop: 6 }}>
                <View style={styles.contactRow}>
                  <Text style={styles.contactKey}>Phone</Text>
                  <Text style={styles.contactVal}>{contactPhone || LETTERHEAD.phones[0]}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactKey}>Email</Text>
                  <Text style={styles.contactVal}>{contactEmail || LETTERHEAD.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactKey}>Web</Text>
                  <Text style={styles.contactVal}>{LETTERHEAD.website}</Text>
                </View>
              </View>

              <Text style={styles.disclaimer}>
                If found, please return to the head office: {LETTERHEAD.headOffice},
                GPS {LETTERHEAD.gps}, {LETTERHEAD.city}. Unauthorised duplication,
                alteration or use of this card is prohibited and may be prosecuted.
                The QR code links only to the public verification page and reveals
                no personal data beyond the holder's name and employment status.
              </Text>
            </View>

            <View style={styles.backRight}>
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
