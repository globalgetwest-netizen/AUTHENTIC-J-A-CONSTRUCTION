import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { LETTERHEAD } from "@/config/documents";
import { DOC_COLORS, Letterhead } from "./Letterhead";

/**
 * Shared premium frame for the corporate certificate suite.
 *
 * Renders the letterhead on cream paper inside a gold + brand-blue double
 * border (the classic certificate look), with a centered gold band for the
 * certificate title, a company seal beside the signature block, and the
 * certificate serial + issue date in the footer. Every certificate in the
 * suite composes this frame so the whole set looks consistent and "bankable".
 */

export const CERT_COLORS = {
  gold: "#C9A227",
  goldDark: "#9A7B1F",
  blue: DOC_COLORS.blue,
  green: DOC_COLORS.green,
  charcoal: DOC_COLORS.charcoal,
  muted: DOC_COLORS.muted,
  border: "#dcd4c0",
  cream: "#FFFEFA",
};

export const CERT_FONT = "Times-Roman";
export const CERT_FONT_BOLD = "Times-Bold";
export const CERT_FONT_ITALIC = "Times-Italic";

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 58,
    paddingHorizontal: 46,
    backgroundColor: CERT_COLORS.cream,
    fontSize: 10,
    color: CERT_COLORS.charcoal,
    fontFamily: CERT_FONT,
  },
  frameOuter: {
    position: "absolute",
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
    borderWidth: 1,
    borderColor: CERT_COLORS.gold,
  },
  frameInner: {
    position: "absolute",
    top: 21,
    bottom: 21,
    left: 21,
    right: 21,
    borderWidth: 2,
    borderColor: CERT_COLORS.blue,
  },
  cornerTL: { position: "absolute", top: 24, left: 24, width: 14, height: 14, borderTopWidth: 3, borderLeftWidth: 3, borderColor: CERT_COLORS.gold },
  cornerTR: { position: "absolute", top: 24, right: 24, width: 14, height: 14, borderTopWidth: 3, borderRightWidth: 3, borderColor: CERT_COLORS.gold },
  cornerBL: { position: "absolute", bottom: 24, left: 24, width: 14, height: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: CERT_COLORS.gold },
  cornerBR: { position: "absolute", bottom: 24, right: 24, width: 14, height: 14, borderBottomWidth: 3, borderRightWidth: 3, borderColor: CERT_COLORS.gold },
  heading: { alignItems: "center", marginTop: 6, marginBottom: 14 },
  goldBand: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginVertical: 8,
  },
  goldRule: { flex: 1, height: 1, backgroundColor: CERT_COLORS.gold },
  diamond: { width: 7, height: 7, backgroundColor: CERT_COLORS.gold, transform: "rotate(45deg)", marginHorizontal: 8 },
  title: {
    fontSize: 19,
    fontFamily: CERT_FONT_BOLD,
    color: CERT_COLORS.blue,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontSize: 9.5,
    fontFamily: CERT_FONT_ITALIC,
    color: CERT_COLORS.muted,
    marginTop: 4,
  },
  serial: {
    fontSize: 8,
    fontFamily: CERT_FONT_BOLD,
    color: CERT_COLORS.goldDark,
    letterSpacing: 1.2,
    marginTop: 5,
  },
  body: { fontSize: 10, lineHeight: 1.65 },
  bodySerif: { fontFamily: CERT_FONT },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: CERT_COLORS.border,
    paddingTop: 5,
  },
  footerText: { fontSize: 7.5, color: CERT_COLORS.muted, fontFamily: CERT_FONT },
});

/**
 * Renders the letterhead then the certificate heading band. `title` is the
 * document name ("CERTIFICATE OF EMPLOYMENT"), `serial` the unique number.
 */
export function CertificateHeading({
  logoSrc,
  letterheadSrc,
  title,
  subtitle,
  serial,
}: {
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  title: string;
  subtitle?: string | null;
  serial?: string | null;
}) {
  return (
    <>
      <Letterhead logoSrc={logoSrc} letterheadSrc={letterheadSrc} />
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.goldBand}>
          <View style={styles.goldRule} />
          <View style={styles.diamond} />
          <View style={styles.goldRule} />
        </View>
        {serial ? <Text style={styles.serial}>CERTIFICATE NO. {serial}</Text> : null}
      </View>
    </>
  );
}

/** Company seal: concentric rings with the registered-name monogram. */
export function Seal({
  monogram = "AJAC",
  caption = "REGISTERED CONSTRUCTION",
}: {
  monogram?: string;
  caption?: string;
}) {
  return (
    <View style={{ width: 86, height: 86, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 86,
          height: 86,
          borderRadius: 43,
          borderWidth: 1.6,
          borderColor: CERT_COLORS.goldDark,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            borderWidth: 1,
            borderColor: CERT_COLORS.gold,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 17, fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.blue, letterSpacing: 1 }}>
            {monogram}
          </Text>
          <Text style={{ fontSize: 4.6, fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.goldDark, letterSpacing: 0.6, marginTop: 2 }}>
            {caption}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** One signature line: dotted rule + name + role. */
export function SignatureBlock({
  label,
  name,
  role,
  align = "left",
}: {
  label: string;
  name: string;
  role: string;
  align?: "left" | "right";
}) {
  return (
    <View style={{ width: "46%", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <Text
        style={{
          fontSize: 7.5,
          fontFamily: CERT_FONT_BOLD,
          color: CERT_COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          marginTop: 30,
          width: "100%",
          borderBottomWidth: 0.8,
          borderBottomColor: CERT_COLORS.charcoal,
        }}
      />
      <Text style={{ fontSize: 9, fontFamily: CERT_FONT_BOLD, color: CERT_COLORS.charcoal, marginTop: 4 }}>
        {name}
      </Text>
      <Text style={{ fontSize: 8, fontFamily: CERT_FONT_ITALIC, color: CERT_COLORS.muted, marginTop: 1 }}>
        {role}
      </Text>
    </View>
  );
}

/** Signature row: two SignatureBlocks side by side, seal centered/beside. */
export function SignatureRow({
  left,
  right,
  showSeal = true,
}: {
  left: { label: string; name: string; role: string };
  right: { label: string; name: string; role: string };
  showSeal?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginTop: 8,
      }}
    >
      <SignatureBlock {...left} />
      {showSeal ? <Seal /> : null}
      <SignatureBlock {...right} align="right" />
    </View>
  );
}

export function CertificateFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        {LETTERHEAD.name} • Reg No. {LETTERHEAD.registrationNo} • TIN: {LETTERHEAD.taxId}
      </Text>
      <Text style={styles.footerText}>{LETTERHEAD.headOffice}</Text>
    </View>
  );
}

/** Outer frame + corners + footer for a certificate page body. */
export function CertificatePage({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.frameOuter} />
      <View style={styles.frameInner} />
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
      {children}
      {showFooter ? <CertificateFooter /> : null}
    </View>
  );
}
