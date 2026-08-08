import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Project } from "@/lib/admin/types";
import { label } from "@/lib/admin/types";
import { dateLabel, money } from "@/lib/documents/format";
import {
  CERT_COLORS,
  CERT_FONT,
  CERT_FONT_BOLD,
  CERT_FONT_ITALIC,
  FONT_DISPLAY,
  FONT_SANS,
  CertificateFooter,
  CertificateHeading,
  CertificatePage,
  SignatureRow,
} from "./CertificateFrame";

const styles = StyleSheet.create({
  intro: { fontSize: 11, lineHeight: 1.85, textAlign: "justify" },
  highlight: { fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.blue },
  projectName: {
    marginTop: 18,
    fontSize: 16,
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    color: CERT_COLORS.navy,
    textAlign: "center",
  },
  projectSub: {
    fontSize: 9,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    textAlign: "center",
    marginTop: 3,
  },
  table: { marginTop: 16, borderWidth: 1, borderColor: CERT_COLORS.border },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: CERT_COLORS.border },
  cellLabel: {
    width: "38%",
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
    marginTop: 14,
    fontSize: 8.8,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    lineHeight: 1.6,
  },
  signatures: { marginTop: 22 },
});

export function ProjectCompletionCertificateTemplate({
  project,
  clientName,
  managerName,
  logoSrc,
  letterheadSrc,
  issuedOn,
}: {
  project: Project;
  clientName?: string | null;
  managerName?: string | null;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  issuedOn: string;
}) {
  const serial = `AJAC/PCC/${issuedOn.slice(0, 4)}/${project.code}`;
  const completionDate = project.endDate ?? issuedOn;

  return (
    <Document>
      <Page size="A4">
        <CertificatePage>
          <CertificateHeading
            logoSrc={logoSrc}
            letterheadSrc={letterheadSrc}
            title="CERTIFICATE OF PRACTICAL COMPLETION"
            subtitle="Works Completion Certificate"
            serial={serial}
          />

          <Text style={styles.intro}>
            This is to certify that the project described below, undertaken by{" "}
            <Text style={styles.highlight}>AUTHENTIC J.A. CONSTRUCTION LTD.</Text>, has been
            completed to a satisfactory standard, inspected and found fit for its intended
            purpose, and hereby reaches <Text style={styles.highlight}>practical completion</Text>{" "}
            effective {dateLabel(completionDate)}.
          </Text>

          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectSub}>Project No. {project.code}</Text>

          <View style={styles.table}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.cellLabel}>Project name</Text>
              <Text style={styles.cellValue}>{project.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Project code</Text>
              <Text style={styles.cellValue}>{project.code}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Project type</Text>
              <Text style={styles.cellValue}>{label(project.projectType)}</Text>
            </View>
            {project.location ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Location</Text>
                <Text style={styles.cellValue}>{project.location}</Text>
              </View>
            ) : null}
            {project.address ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Address</Text>
                <Text style={styles.cellValue}>{project.address}</Text>
              </View>
            ) : null}
            {clientName ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Client</Text>
                <Text style={styles.cellValue}>{clientName}</Text>
              </View>
            ) : null}
            {managerName ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Project manager</Text>
                <Text style={styles.cellValue}>{managerName}</Text>
              </View>
            ) : null}
            {project.startDate ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Commencement</Text>
                <Text style={styles.cellValue}>{dateLabel(project.startDate)}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Completion date</Text>
              <Text style={styles.cellValue}>{dateLabel(completionDate)}</Text>
            </View>
            {project.budgetAmount != null ? (
              <View style={styles.row}>
                <Text style={styles.cellLabel}>Contract value</Text>
                <Text style={styles.cellValue}>{money(project.budgetAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.cellLabel}>Status</Text>
              <Text style={styles.cellValue}>{label(project.status)}</Text>
            </View>
          </View>

          <View style={styles.signatures}>
            <SignatureRow
              left={{
                label: "For and on behalf of the Contractor",
                name: "AUTHENTIC J.A. CONSTRUCTION LTD.",
                role: "Authorised Signatory & Company Seal",
              }}
              right={{
                label: clientName ? "Received by (Client)" : "Project Manager",
                name: clientName ?? managerName ?? "THE PROJECT MANAGER",
                role: clientName ? "Signature" : "Project Manager",
              }}
            />
          </View>

          <Text style={styles.note}>
            This certificate of practical completion is issued without prejudice to any
            obligations that remain under the defects liability period. It does not relieve the
            contractor of liability for latent defects or unfinished works.
          </Text>
          <Text style={styles.note}>Issued on {dateLabel(issuedOn)}.</Text>

          <CertificateFooter />
        </CertificatePage>
      </Page>
    </Document>
  );
}
