import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Client, Project, Quotation } from "@/lib/admin/types";
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
  headingRe: { fontSize: 10, color: C.charcoal, marginTop: 2 },
  block: { marginBottom: 14 },
  blockTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: C.muted,
    fontWeight: "bold",
    marginBottom: 3,
  },
  blockText: { fontSize: 9.5, color: C.charcoal, marginTop: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 8, color: C.muted, textTransform: "uppercase" },
  metaValue: { fontSize: 9.5, color: C.charcoal, marginTop: 1 },
  table: { borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.blue,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8.5, color: "#ffffff", fontWeight: "bold", textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  td: { fontSize: 9, color: C.charcoal },
  totals: { alignItems: "flex-end", marginBottom: 12 },
  totalRow: { flexDirection: "row", width: "52%", paddingVertical: 2 },
  totalKey: { flex: 1, fontSize: 9, color: C.muted },
  totalVal: { flex: 1, fontSize: 9, color: C.charcoal, textAlign: "right" },
  grandRow: {
    flexDirection: "row",
    width: "52%",
    paddingVertical: 4,
    borderTopWidth: 1.5,
    borderTopColor: C.charcoal,
    marginTop: 2,
  },
  grandKey: { flex: 1, fontSize: 11, fontWeight: "bold", color: C.blue },
  grandVal: { flex: 1, fontSize: 11, fontWeight: "bold", color: C.blue, textAlign: "right" },
  body: { fontSize: 8.5, color: C.muted, marginBottom: 12, lineHeight: 1.5 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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

function PaymentBlock() {
  // Show bank names always; account numbers only once they're configured.
  const banks = LETTERHEAD.banks;
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Payment</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {banks.map((bank) => (
          <View key={bank.name} style={{ width: "46%" }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: C.charcoal }}>{bank.name}</Text>
            {bank.accountName ? (
              <Text style={{ fontSize: 8.5, color: C.muted }}>Account: {bank.accountName}</Text>
            ) : null}
            {bank.accountNumber ? (
              <Text style={{ fontSize: 8.5, color: C.muted }}>Number: {bank.accountNumber}</Text>
            ) : null}
            {bank.branch ? (
              <Text style={{ fontSize: 8.5, color: C.muted }}>Branch: {bank.branch}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function QuotationTemplate({
  quotation,
  client,
  project,
  logoSrc,
  letterheadSrc,
}: {
  quotation: Quotation;
  client?: Client | null;
  project?: Project | null;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
}) {
  const clientLines = client
    ? [
        client.companyName || null,
        client.contactName ? `Attn: ${client.contactName}` : null,
        client.email || null,
        client.phone ? `Tel: ${client.phone}` : null,
        client.address || null,
      ].filter((line): line is string => Boolean(line))
    : [];

  const subtotal = Number(quotation.subtotal) || 0;
  const tax = Number(quotation.tax) || 0;
  const discount = Number(quotation.discount) || 0;
  const rate = subtotal > 0 ? (tax / subtotal) * 100 : LETTERHEAD.vatRate;
  const rateLabel = rate.toLocaleString("en-GB", { maximumFractionDigits: 2 });

  return (
    <Document>
      <Page
        size="A4"
        style={[styles.page, ...(letterheadSrc ? [styles.pageOnLetterhead] : [])]}
      >
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} fullPage />

        <View style={styles.heading}>
          <Text style={styles.headingTitle}>QUOTATION</Text>
          <Text style={styles.headingNo}>No. {quotation.quotationNo}</Text>
          {quotation.title ? <Text style={styles.headingRe}>Re: {quotation.title}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Quoted to</Text>
            {clientLines.length ? (
              clientLines.map((line, i) => (
                <Text key={i} style={styles.metaValue}>
                  {line}
                </Text>
              ))
            ) : (
              <Text style={styles.metaValue}>—</Text>
            )}
          </View>
          <View style={styles.metaCol}>
            <Meta label="Date" value={dateLabel(quotation.issuedAt ?? quotation.createdAt)} />
            <Meta label="Valid until" value={dateLabel(quotation.validUntil)} />
            <Meta label="Currency" value={quotation.currency ?? "GHS"} />
            <Meta label="Status" value={quotation.status} />
          </View>
        </View>

        {project ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Project</Text>
            <Text style={styles.blockText}>{project.name}</Text>
            {project.location ? <Text style={styles.blockText}>{project.location}</Text> : null}
            {project.address ? <Text style={styles.blockText}>{project.address}</Text> : null}
          </View>
        ) : null}

        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 3 }]}>Description</Text>
            <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>Qty</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>Unit price</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
          </View>
          {quotation.items.map((item, i) => (
            <View
              key={item.id ?? i}
              style={i % 2 ? [styles.tr, { backgroundColor: C.light }] : styles.tr}
            >
              <Text style={[styles.td, { flex: 3 }]}>{item.description}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                {quantity(item.quantity)}
              </Text>
              <Text style={[styles.td, { flex: 1.5, textAlign: "right" }]}>
                {money(item.unitPrice)}
              </Text>
              <Text style={[styles.td, { flex: 1.5, textAlign: "right" }]}>{money(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Subtotal</Text>
            <Text style={styles.totalVal}>{money(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>VAT ({rateLabel}%)</Text>
            <Text style={styles.totalVal}>{money(quotation.tax)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Discount</Text>
              <Text style={styles.totalVal}>- {money(quotation.discount)}</Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandKey}>TOTAL</Text>
            <Text style={styles.grandVal}>{money(quotation.total)}</Text>
          </View>
        </View>

        <Text style={styles.body}>{LETTERHEAD.defaultTerms}</Text>

        <PaymentBlock />

        <View style={styles.signatures}>
          <Signature
            label="For and on behalf of"
            name={LETTERHEAD.name}
            role="Authorised signatory"
          />
          <Signature
            label="Accepted by"
            name={client?.companyName || client?.contactName || "Client"}
            role="Signature"
          />
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
