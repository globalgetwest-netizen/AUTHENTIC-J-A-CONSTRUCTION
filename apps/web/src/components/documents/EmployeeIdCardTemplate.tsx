import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EmployeeIdRef } from "@/lib/admin/types";
import { idFullName } from "@/lib/admin/types";
import { dateLabel } from "@/lib/documents/format";
import { DOC_COLORS as C } from "./Letterhead";

// Card dimensions (landscape credit-card, readable at 100%): 242 x 152 pt.
const CARD_W = 242;
const CARD_H = 152;

const styles = StyleSheet.create({
  page: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: "#ffffff",
  },
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
    backgroundColor: C.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: { width: 22, height: 22, marginRight: 7, objectFit: "contain" },
  headerText: { flex: 1 },
  company: { color: "#ffffff", fontSize: 9, fontWeight: "bold", letterSpacing: 0.5 },
  subtitle: { color: "#dbe7ff", fontSize: 5.5, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 1 },
  body: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  left: { flex: 1, paddingRight: 8 },
  photo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: C.blue,
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
    backgroundColor: C.blue,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { color: "#ffffff", fontSize: 5.5, textTransform: "uppercase" },
});

export interface EmployeeIdCardTemplateProps {
  logoSrc: string | null;
  employee: EmployeeIdRef | null;
  photoSrc?: string | null;
  cardNumber: string;
  qrSrc: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  status: string;
}

export function EmployeeIdCardTemplate(props: EmployeeIdCardTemplateProps) {
  const { logoSrc, employee, photoSrc, cardNumber, qrSrc, issuedAt, expiresAt, status } = props;
  const initials = employee
    ? [employee.firstName, employee.lastName].map((n) => (n || "").charAt(0)).join("").toUpperCase()
    : "?";
  const name = employee ? idFullName(employee) : "—";

  return (
    <Document>
      <Page size={{ width: CARD_W, height: CARD_H }} style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            {logoSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support
              <Image src={logoSrc} style={styles.logo} />
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.company}>AUTHENTIC J.A. Construction Limited</Text>
              <Text style={styles.subtitle}>Employee Identity Card · Staff ID</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.left}>
              <View style={styles.photo}>
                {photoSrc ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support
                  <Image src={photoSrc} style={styles.photoImg} />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: C.blue }}>{initials}</Text>
                )}
              </View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.code}>
                {employee?.position?.title ?? "Staff"}
                {employee?.department?.name ? ` · ${employee.department.name}` : ""}
              </Text>

              <View style={styles.meta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaKey}>Staff code</Text>
                  <Text style={styles.metaVal}>{employee?.employeeCode ?? "—"}</Text>
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

          <View style={styles.statusBand}>
            <Text style={styles.statusText}>Authentic J.A. Construction Limited</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}