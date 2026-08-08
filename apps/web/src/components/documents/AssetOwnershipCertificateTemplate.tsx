import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { dateLabel } from "@/lib/documents/format";
import {
  CERT_COLORS,
  CERT_FONT,
  CERT_FONT_BOLD,
  CERT_FONT_ITALIC,
  CertificateFooter,
  CertificateHeading,
  CertificatePage,
  SignatureRow,
} from "./CertificateFrame";

const styles = StyleSheet.create({
  intro: { fontSize: 10.5, lineHeight: 1.7, textAlign: "justify" },
  highlight: { fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.blue },
  assetName: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: CERT_FONT_BOLD,
    color: CERT_COLORS.charcoal,
    textAlign: "center",
  },
  assetSub: { fontSize: 9, fontFamily: CERT_FONT_ITALIC, color: CERT_COLORS.muted, textAlign: "center", marginTop: 2 },
  table: { marginTop: 16, borderWidth: 1, borderColor: CERT_COLORS.border },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: CERT_COLORS.border },
  cellLabel: {
    width: "38%",
    backgroundColor: "#faf6e8",
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: CERT_FONT_BOLD,
    color: CERT_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellValue: {
    flex: 1,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    fontSize: 9.5,
    color: CERT_COLORS.charcoal,
    fontFamily: CERT_FONT,
  },
  note: {
    marginTop: 18,
    fontSize: 8.5,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    lineHeight: 1.55,
  },
  signatures: { marginTop: 24 },
});

export function AssetOwnershipCertificateTemplate({
  title,
  subtitle,
  serial,
  owner,
  kind,
  assetName,
  assetSub,
  rows,
  note,
  logoSrc,
  letterheadSrc,
  issuedOn,
}: {
  title: string;
  subtitle: string;
  serial: string;
  owner: string;
  kind: string;
  assetName: string;
  assetSub?: string | null;
  rows: Array<{ label: string; value: string }>;
  note?: string | null;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  issuedOn: string;
}) {
  return (
    <Document>
      <Page size="A4">
        <CertificatePage>
          <CertificateHeading
            logoSrc={logoSrc}
            letterheadSrc={letterheadSrc}
            title={title}
            subtitle={subtitle}
            serial={serial}
          />

          <Text style={styles.intro}>
            This is to certify that <Text style={styles.highlight}>{owner}</Text> is the lawful,
            undisputed owner of the {kind} described below, held in the company's official
            register and subject to all applicable legal and regulatory requirements.
          </Text>

          <Text style={styles.assetName}>{assetName}</Text>
          {assetSub ? <Text style={styles.assetSub}>{assetSub}</Text> : null}

          <View style={styles.table}>
            {rows.map((r, i) => (
              <View
                key={r.label}
                style={
                  i === rows.length - 1 ? [styles.row, { borderBottomWidth: 0 }] : styles.row
                }
              >
                <Text style={styles.cellLabel}>{r.label}</Text>
                <Text style={styles.cellValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.signatures}>
            <SignatureRow
              left={{
                label: "Approved by",
                name: "AUTHENTIC J.A. CONSTRUCTION LTD.",
                role: "Authorised Signatory & Company Seal",
              }}
              right={{
                label: "For and on behalf of",
                name: "THE MANAGING DIRECTOR",
                role: "Managing Director",
              }}
            />
          </View>

          {note ? (
            <Text style={styles.note}>{note}</Text>
          ) : (
            <Text style={styles.note}>
              This certificate confirms company ownership of the above {kind} as recorded in the
              asset register of AUTHENTIC J.A. CONSTRUCTION LTD.
            </Text>
          )}
          <Text style={styles.note}>Issued on {dateLabel(issuedOn)}.</Text>

          <CertificateFooter />
        </CertificatePage>
      </Page>
    </Document>
  );
}
