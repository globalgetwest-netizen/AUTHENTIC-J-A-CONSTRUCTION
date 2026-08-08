import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Project } from "@/lib/admin/types";
import { label } from "@/lib/admin/types";
import { money } from "@/lib/documents/format";
import { LETTERHEAD } from "@/config/documents";
import {
  CERT_COLORS,
  CERT_FONT,
  CERT_FONT_BOLD,
  CERT_FONT_ITALIC,
  FONT_DISPLAY,
  FONT_SANS,
  CertificateFooter,
} from "./CertificateFrame";
import { FONT_BODY } from "@/lib/documents/fonts";
import { Letterhead } from "./Letterhead";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 58,
    paddingHorizontal: 44,
    fontSize: 9.5,
    color: CERT_COLORS.ink,
    fontFamily: FONT_BODY,
  },
  title: {
    marginTop: 6,
    fontSize: 24,
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    color: CERT_COLORS.navy,
    textAlign: "center",
    letterSpacing: 3.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    textAlign: "center",
    marginTop: 4,
  },
  band: { flexDirection: "row", alignItems: "center", marginVertical: 12, paddingHorizontal: 10 },
  rule: { flex: 1, height: 0.8, backgroundColor: CERT_COLORS.gold },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: CERT_COLORS.gold,
    transform: "rotate(45deg)",
    marginHorizontal: 10,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: CERT_COLORS.gold, marginHorizontal: 6 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONT_SANS,
    fontWeight: 700,
    color: CERT_COLORS.goldDeep,
    textTransform: "uppercase",
    letterSpacing: 1.7,
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: { fontSize: 9.5, lineHeight: 1.75, textAlign: "justify", marginTop: 4 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  factCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: CERT_COLORS.border,
    backgroundColor: CERT_COLORS.paper,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginBottom: 6,
  },
  factLabel: {
    fontSize: 6.8,
    fontFamily: FONT_SANS,
    fontWeight: 600,
    color: CERT_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  factValue: { fontSize: 9, fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.ink, marginTop: 1.5 },
  services: { marginTop: 6 },
  serviceRow: { flexDirection: "row", marginBottom: 5, alignItems: "flex-start" },
  bullet: { width: 8, fontSize: 9, color: CERT_COLORS.goldDeep, fontFamily: CERT_FONT_BOLD },
  serviceName: { width: "34%", fontSize: 9, fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.ink },
  serviceDesc: { flex: 1, fontSize: 8.8, color: CERT_COLORS.ink, lineHeight: 1.55 },
  table: { borderWidth: 1, borderColor: CERT_COLORS.border, marginTop: 6 },
  theadRow: { flexDirection: "row", backgroundColor: CERT_COLORS.navy },
  th: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 6.8,
    fontFamily: FONT_SANS,
    fontWeight: 600,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  row: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: CERT_COLORS.border },
  td: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.5, color: CERT_COLORS.ink },
  tdMuted: { paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.5, color: CERT_COLORS.muted },
  signature: { marginTop: 26, alignItems: "center" },
  sigLine: { width: "34%", borderBottomWidth: 0.8, borderBottomColor: CERT_COLORS.ink, marginTop: 30 },
  sigName: { fontSize: 9.5, fontFamily: FONT_DISPLAY, fontWeight: 600, marginTop: 4 },
  sigRole: { fontSize: 8, fontFamily: CERT_FONT_ITALIC, color: CERT_COLORS.muted, marginTop: 1 },
});

const SERVICES: Array<{ name: string; desc: string }> = [
  { name: "Construction", desc: "Residential and commercial building construction delivered to specification, on time and budget." },
  { name: "Engineering", desc: "Civil and structural engineering, site works, drainage and infrastructure." },
  { name: "Real Estate", desc: "Property development, sales and rentals of houses, apartments and commercial units." },
  { name: "Land Allocation", desc: "Trusted land acquisition, plot allocation and documentation." },
  { name: "Building Materials", desc: "Supply of quarry stones, sand, gravel, cement and construction aggregates." },
  { name: "Block Factory", desc: "High-strength factory-made blocks produced to consistent quality standards." },
  { name: "Project Management", desc: "End-to-end project planning, supervision, quality and cost control." },
  { name: "Equipment & Fleet", desc: "Heavy equipment and fleet services for construction and haulage." },
];

export function CompanyProfileTemplate({
  logoSrc,
  letterheadSrc,
  issuedOn,
  projects = [],
  equipment = [],
}: {
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  issuedOn: string;
  projects: Array<Pick<Project, "code" | "name" | "projectType" | "status" | "client">>;
  equipment: Array<{ assetCode: string; name: string; category: string; status: string }>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} />
        <Text style={styles.title}>COMPANY PROFILE</Text>
        <Text style={styles.subtitle}>Corporate Capability Statement</Text>
        <View style={styles.band}>
          <View style={styles.rule} />
          <View style={styles.diamond} />
          <View style={styles.rule} />
        </View>

        <Text style={styles.sectionTitle}>About the company</Text>
        <Text style={styles.paragraph}>
          {LETTERHEAD.name} is a fully registered Ghanaian construction, engineering and real
          estate group (Reg No. {LETTERHEAD.registrationNo}, TIN {LETTERHEAD.taxId}). We deliver
          quality structures and trusted solutions across construction, engineering, real estate,
          property development, land allocation, building materials and block manufacturing.
          Our operations are rooted in safety, accuracy and professional integrity, and every
          project is executed under experienced management with full documentation.
        </Text>

        <View style={styles.facts}>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Registration No.</Text>
            <Text style={styles.factValue}>{LETTERHEAD.registrationNo}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Tax Identification No.</Text>
            <Text style={styles.factValue}>{LETTERHEAD.taxId}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Head Office</Text>
            <Text style={styles.factValue}>{LETTERHEAD.headOffice}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Contact</Text>
            <Text style={styles.factValue}>
              {LETTERHEAD.phones.join(" / ")}
            </Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Email</Text>
            <Text style={styles.factValue}>{LETTERHEAD.email}</Text>
          </View>
          <View style={styles.factCard}>
            <Text style={styles.factLabel}>Registered Address</Text>
            <Text style={styles.factValue}>{LETTERHEAD.registeredAddress}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Core services & capabilities</Text>
        <View style={styles.services}>
          {SERVICES.map((s) => (
            <View key={s.name} style={styles.serviceRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.serviceDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Project portfolio</Text>
        <View style={styles.table}>
          <View style={styles.theadRow}>
            <Text style={[styles.th, { width: "22%" }]}>Code</Text>
            <Text style={[styles.th, { width: "40%" }]}>Project</Text>
            <Text style={[styles.th, { width: "18%" }]}>Type</Text>
            <Text style={[styles.th, { width: "20%" }]}>Status</Text>
          </View>
          {projects.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.td, { width: "100%" }]}>No projects recorded yet.</Text>
            </View>
          ) : (
            projects.map((p) => (
              <View key={p.code} style={styles.row}>
                <Text style={[styles.tdMuted, { width: "22%" }]}>{p.code}</Text>
                <Text style={[styles.td, { width: "40%" }]}>{p.name}</Text>
                <Text style={[styles.td, { width: "18%" }]}>{label(p.projectType)}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{label(p.status)}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Equipment & fleet</Text>
        <View style={styles.table}>
          <View style={styles.theadRow}>
            <Text style={[styles.th, { width: "26%" }]}>Asset code</Text>
            <Text style={[styles.th, { width: "36%" }]}>Equipment</Text>
            <Text style={[styles.th, { width: "18%" }]}>Category</Text>
            <Text style={[styles.th, { width: "20%" }]}>Status</Text>
          </View>
          {equipment.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.td, { width: "100%" }]}>No equipment recorded yet.</Text>
            </View>
          ) : (
            equipment.map((e) => (
              <View key={e.assetCode} style={styles.row}>
                <Text style={[styles.tdMuted, { width: "26%" }]}>{e.assetCode}</Text>
                <Text style={[styles.td, { width: "36%" }]}>{e.name}</Text>
                <Text style={[styles.td, { width: "18%" }]}>{label(e.category)}</Text>
                <Text style={[styles.td, { width: "20%" }]}>{label(e.status)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.signature}>
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>THE MANAGING DIRECTOR</Text>
          <Text style={styles.sigRole}>For and on behalf of {LETTERHEAD.name}</Text>
        </View>

        <CertificateFooter />
      </Page>
    </Document>
  );
}
