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
 * Supports multi-page letters: letterhead background on page 1 only,
 * clean continuation pages for overflow content, and signature/stamp
 * always rendered on the final page.
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
  const isFullLetterhead = !!letterheadSrc;
  return (
    <Document>
      {/* Page 1: letterhead background + content */}
      <Page size="A4" style={styles.page}>
        <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} fullPage repeat={false} />

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

        {/* Reserve space for signature/stamp on final page - render conditionally on last page */}
        {letter.paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        <Text style={styles.signOff}>Yours faithfully,</Text>
      </Page>

      {/* Page 2+: clean continuation pages (if needed) */}
      {letter.paragraphs.length > 3 && (
        <>
          {/* Calculate how many overflow pages we need */}
          {Array.from({ length: Math.max(0, letter.paragraphs.length - 3) }).map((_, pageIndex) => (
            <Page key={pageIndex + 2} size="A4" style={styles.page}>
              {/* Continuation pages get only the letterhead logo at top (no full background) */}
              <View style={{ paddingTop: 20, paddingBottom: 48, paddingHorizontal: 48 }}>
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 20 }}
                  />
                ) : null}
                <Text style={{ fontSize: 9, color: C.charcoal, textAlign: "center", marginBottom: 10 }}>
                  — {letter.refNo} — Page {pageIndex + 2} —
                </Text>
                {/* Render overflow paragraphs starting from index 3 */}
                {letter.paragraphs.slice(3 + pageIndex * 2, 3 + (pageIndex + 1) * 2).map((p, paraIndex) => (
                  <Text key={paraIndex} style={styles.paragraph}>
                    {p}
                  </Text>
                ))}
              </View>
            </Page>
          ))}
        </>
      )}

      {/* Final page: signature and stamp (always rendered on last page) */}
      <Page size="A4" style={styles.page}>
        <View style={{ paddingTop: 20, paddingBottom: 48, paddingHorizontal: 48 }}>
          {logoSrc ? (
            <Image
              src={logoSrc}
              style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 20 }}
            />
          ) : null}
          <Text style={{ fontSize: 9, color: C.charcoal, textAlign: "center", marginBottom: 30 }}>
            — {letter.refNo} —
          </Text>

          <View style={styles.signatureBlock}>
            <View style={styles.signLeft}>
              {signatureSrc ? (
              <Image
                src={signatureSrc}
                style={styles.sigImage}
              />
            ) : null}
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{LETTERHEAD.ceo.name}</Text>
              <Text style={styles.sigTitle}>{LETTERHEAD.ceo.title}</Text>
              <Text style={styles.sigTitle}>For and on behalf of {LETTERHEAD.name}</Text>
            </View>
            {stampSrc ? (
              <View style={{ width: 100, alignItems: "center", justifyContent: "flex-end", paddingBottom: 4 }}>
                <Image
                  src={stampSrc}
                  style={{ width: 96, height: 96, objectFit: "contain" }}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}