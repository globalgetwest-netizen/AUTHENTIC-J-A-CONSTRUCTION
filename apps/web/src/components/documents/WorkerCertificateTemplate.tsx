import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Employee } from "@/lib/admin/types";
import { label } from "@/lib/admin/types";
import { dateLabel } from "@/lib/documents/format";
import {
  CERT_COLORS,
  CERT_FONT,
  CERT_FONT_BOLD,
  CERT_FONT_ITALIC,
  FONT_SANS,
  CertificateFooter,
  CertificateHeading,
  CertificatePage,
  SignatureRow,
} from "./CertificateFrame";

const styles = StyleSheet.create({
  intro: { fontSize: 11, lineHeight: 1.85, textAlign: "justify" },
  highlight: { fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.blue },
  block: { marginTop: 18 },
  blockTitle: {
    fontSize: 7.5,
    fontFamily: FONT_SANS,
    fontWeight: 700,
    color: CERT_COLORS.goldDeep,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  table: { borderWidth: 1, borderColor: CERT_COLORS.border },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: CERT_COLORS.border },
  cellLabel: {
    width: "36%",
    backgroundColor: CERT_COLORS.paper,
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 7.5,
    fontFamily: FONT_SANS,
    fontWeight: 600,
    color: CERT_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cellValue: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    fontSize: 10,
    fontFamily: CERT_FONT,
    fontWeight: 500,
    color: CERT_COLORS.ink,
  },
  note: {
    marginTop: 16,
    fontSize: 8.8,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    lineHeight: 1.6,
  },
  signatures: { marginTop: 24 },
});

function Row({ label: lab, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cellLabel}>{lab}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

export function WorkerCertificateTemplate({
  employee,
  logoSrc,
  letterheadSrc,
  signatureSrc,
  stampSrc,
  issuedOn,
}: {
  employee: Employee;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  signatureSrc?: string | null;
  stampSrc?: string | null;
  issuedOn: string;
}) {
  const fullName = [employee.firstName, employee.lastName, employee.otherNames]
    .filter(Boolean)
    .join(" ");
  const position = employee.position?.title ?? "a member of staff";
  const department = employee.department?.name ?? "the company";
  const branch = employee.branch?.name ?? "Kumasi, Ghana";
  const serial = `AJAC/COE/${issuedOn.slice(0, 4)}/${employee.employeeCode}`;
  const terminated = employee.status === "TERMINATED";

  return (
    <Document>
      <Page size="A4">
        <CertificatePage watermarkSrc={logoSrc}>
          <CertificateHeading
            logoSrc={logoSrc}
            letterheadSrc={letterheadSrc}
            title="CERTIFICATE OF EMPLOYMENT"
            subtitle="Official Worker Certificate"
            serial={serial}
          />

          <Text style={styles.intro}>
            This is to certify that <Text style={styles.highlight}>{fullName}</Text>, holding
            staff number <Text style={styles.highlight}>{employee.employeeCode}</Text>, is{" "}
            {terminated ? "a former member of staff" : "a duly registered member of staff"} of{" "}
            {CERTIFICATE_OF_EMPLOYMENT_COMPANY} and was employed{" "}
            {terminated ? "from" : "since"}{" "}
            <Text style={styles.highlight}>{dateLabel(employee.hireDate)}</Text>
            {terminated && employee.terminationDate
              ? ` to ${dateLabel(employee.terminationDate)}`
              : ""}{" "}
            in the capacity of <Text style={styles.highlight}>{position}</Text> within the{" "}
            {department} at our {branch} office{employee.employmentType
              ? ` on a ${label(employee.employmentType)} basis`
              : ""}.
          </Text>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Worker particulars</Text>
            <View style={styles.table}>
              <Row label="Full name" value={fullName} />
              <Row label="Staff number" value={employee.employeeCode} />
              <Row label="Position" value={position} />
              <Row label="Department" value={employee.department?.name ?? "—"} />
              <Row label="Employment type" value={label(employee.employmentType)} />
              <Row label="Date of employment" value={dateLabel(employee.hireDate)} />
              {employee.terminationDate ? (
                <Row label="Date of exit" value={dateLabel(employee.terminationDate)} />
              ) : null}
              <Row label="Employment status" value={label(employee.status)} />
              {employee.gender ? <Row label="Gender" value={label(employee.gender)} /> : null}
              {employee.nationalId ? <Row label="National ID" value={employee.nationalId} /> : null}
            </View>
          </View>

          <View style={styles.signatures}>
            <SignatureRow
              stampSrc={stampSrc}
              left={{
                label: "Approved by",
                name: "AUTHENTIC J.A. CONSTRUCTION LTD.",
                role: "Authorised Signatory & Company Seal",
              }}
              right={{
                label: "For and on behalf of",
                name: "JOSEPH ACQUAH",
                role: "Chief Executive Officer",
                signatureSrc,
              }}
            />
          </View>

          <Text style={styles.note}>
            This certificate is issued by AUTHENTIC J.A. CONSTRUCTION LTD. as a true and accurate
            record of the worker's employment with the company. It is provided for employment
            confirmation and identification purposes only, and does not constitute a guarantee of
            future or continued employment.
          </Text>
          <Text style={styles.note}>
            Issued on {dateLabel(issuedOn)}. Any alteration renders this certificate void.
          </Text>

          <CertificateFooter />
        </CertificatePage>
      </Page>
    </Document>
  );
}

const CERTIFICATE_OF_EMPLOYMENT_COMPANY =
  "AUTHENTIC J.A. CONSTRUCTION LTD.";
