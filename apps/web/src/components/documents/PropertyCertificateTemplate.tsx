import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Client, Property, PropertySale } from "@/lib/admin/types";
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
  blockText: { fontSize: 9.5, color: C.charcoal, marginTop: 1 },
  table: { borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLast: { flexDirection: "row" },
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

export function PropertyCertificateTemplate({
  sale,
  property,
  client,
  logoSrc,
  letterheadSrc,
}: {
  sale: PropertySale;
  property?: Property | null;
  client?: Client | null;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
}) {
  const ownerName = client?.companyName || client?.contactName || "Client";
  const propertyName = property?.name || "Property";
  const propertyCode = property?.code || "";
  const typeName = property?.propertyType?.name ?? null;
  const soldPrice = money(sale.price);
  const area = property?.areaSqm != null ? `${quantity(property.areaSqm)} m²` : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} />

        <View style={styles.heading}>
          <Text style={styles.headingTitle}>CERTIFICATE OF OWNERSHIP</Text>
          <Text style={styles.headingNo}>Certificate No. {sale.saleCode}</Text>
        </View>

        <Text style={styles.intro}>
          This is to certify that <Text style={styles.highlight}>{ownerName}</Text> is the duly
          registered owner of the property described below, purchased from {LETTERHEAD.name} on{" "}
          {dateLabel(sale.saleDate)} for the sum of {soldPrice}.
        </Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Property</Text>
          <View style={styles.table}>
            <Row label="Property" value={propertyName} />
            {propertyCode ? <Row label="Property code" value={propertyCode} /> : null}
            {typeName ? <Row label="Type" value={typeName} /> : null}
            {property?.address ? <Row label="Address" value={property.address} /> : null}
            {property?.location ? <Row label="Location" value={property.location} /> : null}
            <Row label="Area" value={area} />
            <Row label="Bedrooms" value={property?.bedrooms != null ? String(property.bedrooms) : "—"} />
            <Row label="Bathrooms" value={property?.bathrooms != null ? String(property.bathrooms) : "—"} />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Ownership details</Text>
          <View style={styles.table}>
            <Row label="Owner" value={ownerName} />
            {client?.contactName ? <Row label="Contact person" value={client.contactName} /> : null}
            {client?.email ? <Row label="Email" value={client.email} /> : null}
            {client?.phone ? <Row label="Phone" value={client.phone} /> : null}
            <Row label="Purchase price" value={soldPrice} />
            <Row
              label="Deposit paid"
              value={sale.depositAmount != null ? money(sale.depositAmount) : "—"}
            />
            <Row
              label="Balance"
              value={sale.balanceAmount != null ? money(sale.balanceAmount) : "—"}
            />
            <Row label="Sale date" value={dateLabel(sale.saleDate)} />
            <Row label="Status" value={sale.status} />
          </View>
        </View>

        <View style={styles.signatures}>
          <Signature
            label="For and on behalf of"
            name={LETTERHEAD.name}
            role="Authorised signatory"
          />
          <Signature label="Registered owner" name={ownerName} role="Signature" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {LETTERHEAD.name} • {LETTERHEAD.email}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
