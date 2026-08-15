import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LETTERHEAD } from "@/config/documents";
import { dateLabel } from "@/lib/documents/format";
import { FONT_BODY, FONT_DISPLAY, FONT_SANS } from "@/lib/documents/fonts";
import { DOC_COLORS as C, Letterhead } from "./Letterhead";

const styles = StyleSheet.create({
  page: {
    /** Full-A4 CEO letterhead: content sits in the white zone between bands. */
    paddingTop: 205,
    paddingBottom: 148,
    paddingHorizontal: 48,
    fontSize: 10,
    color: C.charcoal,
    fontFamily: FONT_BODY,
  },
  officeLabel: {
    fontSize: 7.5,
    fontFamily: FONT_SANS,
    fontWeight: 700,
    color: C.goldDeep,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  refDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 16,
  },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", fontFamily: FONT_SANS, fontWeight: 600 },
  metaValue: { fontSize: 10, color: C.charcoal, marginTop: 1.5 },
  recipient: { marginBottom: 18 },
  recipientName: { fontSize: 10.5, fontFamily: FONT_SANS, fontWeight: 700, color: C.navy },
  recipientLine: { fontSize: 9.5, color: C.charcoal, marginTop: 1 },
  salutation: { fontSize: 10.5, color: C.charcoal, marginBottom: 12 },
  subject: {
    fontSize: 10.5,
    fontFamily: FONT_SANS,
    fontWeight: 700,
    color: C.navy,
    marginBottom: 12,
  },
  paragraph: { fontSize: 10, lineHeight: 1.75, textAlign: "justify", marginBottom: 10, color: C.charcoal },
  signOff: { fontSize: 10.5, color: C.charcoal, marginTop: 8, marginBottom: 2 },
  signatureBlock: { flexDirection: "row", alignItems: "flex-end", marginTop: 22 },
  signLeft: { flex: 1 },
  sigImage: { width: 120, height: 44, objectFit: "contain", marginBottom: -4 },
  sigLine: { width: 190, borderBottomWidth: 0.9, borderBottomColor: C.charcoal, marginTop: 18 },
  sigName: { fontSize: 11, fontFamily: FONT_DISPLAY, fontWeight: 600, color: C.navy, marginTop: 4 },
  sigTitle: { fontSize: 8.5, fontFamily: FONT_SANS, color: C.muted, marginTop: 1.5 },
  pageFooter: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 7,
    fontFamily: FONT_SANS,
    color: C.goldDeep,
    letterSpacing: 1,
  },
});

export interface CeoLetterData {
  refNo: string;
  date?: string;
  recipient: string;
  recipientAddress?: string;
  salutation?: string;
  subject: string;
  paragraphs: string[];
}

/**
 * Official executive correspondence on the CEO & Founder letterhead (full-page
 * background). The CEO signature block closes the letter; no separate footer is
 * rendered because the letterhead carries its own.
 *
 * Pagination is delegated to @react-pdf/renderer: all body paragraphs plus the
 * signature/stamp are placed in a single flowing block, so the engine splits
 * the content across as many A4 pages as needed, repeats the letterhead
 * background on every page, and naturally lands the signature on the final
 * page. A fixed "Page X / Y" line is stamped at the bottom of each page.
 */
export function CeoLetterTemplate({
  letter,
  logoSrc,
  letterheadSrc,
  signatureSrc,
  stampSrc,
}: {
  letter: CeoLetterData;
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  signatureSrc?: string | null;
  stampSrc?: string | null;
}) {
  const salutation = letter.salutation ?? "Dear Sir/Madam,";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead background repeats on every page of the letter. */}
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} fullPage repeat />

        <Text style={styles.officeLabel}>OFFICE OF THE CEO & FOUNDER</Text>

        <View style={styles.refDateRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Reference</Text>
            <Text style={styles.metaValue}>{letter.refNo}</Text>
          </View>
          <View style={[styles.metaCol, { alignItems: "flex-end" }]}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {dateLabel(letter.date ?? new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View style={styles.recipient}>
          <Text style={styles.recipientName}>{letter.recipient}</Text>
          {letter.recipientAddress ? (
            <Text style={styles.recipientLine}>{letter.recipientAddress}</Text>
          ) : null}
        </View>

        <Text style={styles.salutation}>{salutation}</Text>
        <Text style={styles.subject}>{letter.subject}</Text>

        {letter.paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph} wrap>
            {p}
          </Text>
        ))}

        <Text style={styles.signOff}>Yours faithfully,</Text>

        {/* Signature block closes the letter — flows to wherever the last page is. */}
        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signLeft}>
            {signatureSrc ? (
              <Image src={signatureSrc} style={styles.sigImage} />
            ) : null}
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{LETTERHEAD.ceo.name}</Text>
            <Text style={styles.sigTitle}>{LETTERHEAD.ceo.title}</Text>
            <Text style={styles.sigTitle}>For and on behalf of {LETTERHEAD.name}</Text>
          </View>
          {stampSrc ? (
            <View style={{ width: 100, alignItems: "center", justifyContent: "flex-end", paddingBottom: 4 }}>
              <Image src={stampSrc} style={{ width: 96, height: 96, objectFit: "contain" }} />
            </View>
          ) : null}
        </View>

        {/* Fixed page number on every page. */}
        <Text
          style={styles.pageFooter}
          fixed
          render={({ pageNumber, totalPages }) => `${letter.refNo}    ·    Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}