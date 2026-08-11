import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Client, LandAllocation, LandPlot, LandProject } from "@/lib/admin/types";
import { LETTERHEAD } from "@/config/documents";
import { dateLabel, money, quantity } from "@/lib/documents/format";
import { DOC_COLORS as C, Letterhead } from "./Letterhead";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 64,
    fontSize: 10,
    color: C.charcoal,
    fontFamily: "Helvetica",
  },
  /** Full-A4 letterhead: content sits in the white zone between header and footer bands. */
  pageOnLetterhead: { paddingTop: 205, paddingBottom: 148 },
  heading: { alignItems: "center", marginBottom: 18 },
  headingTitle: { fontSize: 20, fontWeight: "bold", color: C.blue, letterSpacing: 3 },
  headingNo: { fontSize: 10, color: C.muted, marginTop: 3 },
  intro: { fontSize: 9.5, color: C.charcoal, marginBottom: 14, lineHeight: 1.6 },
  block: { marginBottom: 14 },
  blockTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: C.muted,
    fontWeight: "bold",
    marginBottom: 3,
  },
  table: { borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border },
  cellLabel: {
    width: "38%",
    backgroundColor: C.light,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8,
    color: C.muted,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  cellValue: { flex: 1, paddingVertical: 5, paddingHorizontal: 8, fontSize: 9.5, color: C.charcoal },
  highlight: { fontSize: 11, fontWeight: "bold", color: C.blue },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sigBox: { width: "45%" },
  sigLabel: { fontSize: 8, color: C.muted, textTransform: "uppercase" },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C.charcoal, marginVertical: 34 },
  sigName: { fontSize: 9, fontWeight: "bold", color: C.charcoal },
  sigRole: { fontSize: 8, color: C.muted, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.muted },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

function Signature({ label, name, role }: { label: string; name: string; role: string }) {
  return (
    <View style={styles.sigBox}>
      <Text style={styles.sigLabel}>{label}</Text>
      <View style={styles.sigLine} />
      <Text style={styles.sigName}>{name}</Text>
      <Text style={styles.sigRole}>{role}</Text>
    </View>
  );
}

export function LandAllocationTemplate({
  allocation,
  project,
  plot,
  client,
  logoSrc,
  letterheadSrc,
}: {
  allocation: LandAllocation;
  project?: LandProject | null;
  plot?: LandPlot | null;
  client?: Client | null;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
}) {
  const ownerName = client?.companyName || client?.contactName || "Client";
  const projectName = project?.name || allocation.landProject?.name || "Land project";
  const plotNumber = plot?.plotNumber || allocation.plot?.plotNumber || "—";
  const amount = money(allocation.amount);
  const size = plot?.sizeSqm != null ? `${quantity(plot.sizeSqm)} m²` : "—";

  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, ...(letterheadSrc ? [styles.pageOnLetterhead] : [])]}
      >
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} fullPage />

        <View style={styles.heading}>
          <Text style={styles.headingTitle}>ALLOCATION OF LAND</Text>
          <Text style={styles.headingNo}>Allocation No. {allocation.allocationCode}</Text>
        </View>

        <Text style={styles.intro}>
          This is to certify that <Text style={styles.highlight}>{ownerName}</Text> has been
          allocated Plot {plotNumber} in {projectName} by {LETTERHEAD.name} for the sum of {amount}.
        </Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Plot</Text>
          <View style={styles.table}>
            <Row label="Project" value={projectName} />
            {project?.location ? <Row label="Location" value={project.location} /> : null}
            <Row label="Plot number" value={plotNumber} />
            <Row label="Plot size" value={size} />
            {plot?.address ? <Row label="Address" value={plot.address} /> : null}
            {plot?.coordinates ? <Row label="Coordinates" value={plot.coordinates} /> : null}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Allocatee</Text>
          <View style={styles.table}>
            <Row label="Name" value={ownerName} />
            {client?.contactName ? <Row label="Contact person" value={client.contactName} /> : null}
            {client?.email ? <Row label="Email" value={client.email} /> : null}
            {client?.phone ? <Row label="Phone" value={client.phone} /> : null}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Terms</Text>
          <View style={styles.table}>
            <Row label="Allocated amount" value={amount} />
            <Row label="Allocation date" value={dateLabel(allocation.allocatedAt)} />
            <Row label="Signed at" value={allocation.signedAt ? dateLabel(allocation.signedAt) : "—"} />
            <Row label="Status" value={allocation.status} />
          </View>
        </View>

        <View style={styles.signatures}>
          <Signature
            label="For and on behalf of"
            name={LETTERHEAD.name}
            role="Authorised signatory"
          />
          <Signature label="Allocatee" name={ownerName} role="Signature" />
        </View>

        {letterheadSrc ? null : (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {LETTERHEAD.name} • {LETTERHEAD.email}
            </Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            />
          </View>
        )}
      </Page>
    </Document>
  );
}
