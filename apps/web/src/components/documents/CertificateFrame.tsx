import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LETTERHEAD } from "@/config/documents";
import {
  FONT_BODY,
  FONT_BODY_BOLD,
  FONT_BODY_ITALIC,
  FONT_DISPLAY,
  FONT_SANS,
} from "@/lib/documents/fonts";
import { DOC_COLORS, Letterhead } from "./Letterhead";

export { FONT_BODY, FONT_DISPLAY, FONT_SANS };

/**
 * Shared premium frame for the corporate certificate suite.
 *
 * A classic "bankable" certificate on warm cream paper: three nested rules
 * (gold / navy / gold hairline) with corner ornaments, a faint engraved-style
 * watermark (company monogram inside a gold ring), a gold-band title block
 * with serial number, a wax-seal beside the signature row, and the company
 * registry details in the footer. The type stack is premium throughout:
 * Playfair Display for titles, EB Garamond for copy, Inter for the small
 * labels — every certificate in the suite composes this frame, so the whole
 * set reads as one ground-up designed system.
 */

export const CERT_COLORS = {
  gold: "#C2A15B",
  goldLight: "#E8D6AA",
  goldDeep: "#8E6D22",
  navy: "#14324F",
  blue: DOC_COLORS.blue,
  ink: "#26303B",
  charcoal: "#26303B",
  muted: "#5B6674",
  border: "#DAD0B8",
  paper: "#FAF5EA",
  cream: "#FDFCF7",
};

export const CERT_FONT = FONT_BODY;
export const CERT_FONT_BOLD = FONT_BODY_BOLD;
export const CERT_FONT_ITALIC = FONT_BODY_ITALIC;

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 38,
    paddingHorizontal: 38,
    backgroundColor: CERT_COLORS.cream,
    fontSize: 11,
    color: CERT_COLORS.ink,
    fontFamily: FONT_BODY,
  },
  // ---- Frame: three nested rules + corner ornaments ----
  frameOuter: {
    position: "absolute",
    top: 17,
    bottom: 17,
    left: 17,
    right: 17,
    borderWidth: 1.2,
    borderColor: CERT_COLORS.gold,
  },
  frameNavy: {
    position: "absolute",
    top: 24,
    bottom: 24,
    left: 24,
    right: 24,
    borderWidth: 2,
    borderColor: CERT_COLORS.navy,
  },
  frameHair: {
    position: "absolute",
    top: 29,
    bottom: 29,
    left: 29,
    right: 29,
    borderWidth: 0.6,
    borderColor: CERT_COLORS.gold,
  },
  corner: {
    position: "absolute",
    width: 13,
    height: 13,
    borderColor: CERT_COLORS.gold,
    opacity: 0.9,
  },
  cornerTL: { top: 26, left: 26, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 26, right: 26, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 26, left: 26, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 26, right: 26, borderBottomWidth: 3, borderRightWidth: 3 },

  // ---- Watermark ----
  watermark: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  wmRing: {
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1.4,
    borderColor: CERT_COLORS.gold,
    opacity: 0.35,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  wmRingInner: {
    width: 272,
    height: 272,
    borderRadius: 136,
    borderWidth: 0.7,
    borderColor: CERT_COLORS.gold,
    opacity: 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
  wmText: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: 205,
    color: CERT_COLORS.navy,
    opacity: 0.055,
    transform: "rotate(-7deg)",
  },
  wmCaption: {
    marginTop: 14,
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 7,
    letterSpacing: 4,
    color: CERT_COLORS.navy,
    opacity: 0.16,
  },

  // ---- Heading block ----
  heading: { alignItems: "center", marginTop: 2, marginBottom: 6 },
  title: {
    fontSize: 19,
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    color: CERT_COLORS.navy,
    textTransform: "uppercase",
    letterSpacing: 3.6,
  },
  subtitle: {
    fontSize: 9.5,
    fontFamily: FONT_BODY,
    fontStyle: "italic",
    color: CERT_COLORS.muted,
    marginTop: 2,
  },
  goldBand: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  goldRule: { flex: 1, height: 0.8, backgroundColor: CERT_COLORS.gold },
  goldDiamond: {
    width: 9,
    height: 9,
    backgroundColor: CERT_COLORS.gold,
    transform: "rotate(45deg)",
    marginHorizontal: 11,
  },
  goldDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: CERT_COLORS.gold,
    marginHorizontal: 7,
  },
  serial: {
    fontFamily: FONT_SANS,
    fontWeight: 600,
    fontSize: 7.5,
    color: CERT_COLORS.goldDeep,
    letterSpacing: 1.8,
    marginTop: 2,
  },

  // ---- Body ----
  body: { fontSize: 11, lineHeight: 1.8 },
  bodySerif: { fontFamily: FONT_BODY },

  // ---- Footer ----
  footer: {
    position: "absolute",
    bottom: 30,
    left: 70,
    right: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: CERT_COLORS.gold,
    paddingTop: 6,
  },
  footerText: {
    fontFamily: FONT_SANS,
    fontWeight: 400,
    fontSize: 6.4,
    color: CERT_COLORS.muted,
    letterSpacing: 0.4,
  },
});

/**
 * Renders the letterhead then the certificate heading block: title, subtitle,
 * a gold rule flanked by diamonds, and the serial number.
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
          <View style={styles.goldDot} />
          <View style={styles.goldDiamond} />
          <View style={styles.goldDot} />
          <View style={styles.goldRule} />
        </View>
        {serial ? <Text style={styles.serial}>CERTIFICATE NO. {serial}</Text> : null}
      </View>
    </>
  );
}

/**
 * Official circular company seal — the CEO stamp used beside the signature row.
 * Concentric navy rings (double ring effect) with the corporate monogram in the
 * centre, registered company name at the top, "• GHANA •" at the bottom, and
 * the executive office text below the logo — matching the formal stamped seal
 * used on paper documents.
 */
export function Seal({
  monogramSrc = LETTERHEAD.monogram,
  scale = 1,
}: {
  monogramSrc?: string;
  /** Uniform scale for compact layouts — use ~0.7 inside signature rows. */
  scale?: number;
}) {
  const s = scale;
  return (
    <View style={{ width: 114 * s, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {/* Outer circle — thick navy border */}
      <View
        style={{
          width: 108 * s,
          height: 108 * s,
          borderRadius: 54 * s,
          borderWidth: 2.2 * s,
          borderColor: CERT_COLORS.navy,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner circle — thin navy border */}
        <View
          style={{
            width: 92 * s,
            height: 92 * s,
            borderRadius: 46 * s,
            borderWidth: 1.2 * s,
            borderColor: CERT_COLORS.navy,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Company name — top of inner circle */}
          <Text
            style={{
              fontSize: 5.8 * s,
              fontFamily: FONT_SANS,
              fontWeight: 700,
              color: CERT_COLORS.navy,
              textAlign: "center",
              letterSpacing: 0.4 * s,
              lineHeight: 1.4,
            }}
          >
            AUTHENTIC J.A.
          </Text>
          <Text
            style={{
              fontSize: 4.9 * s,
              fontFamily: FONT_SANS,
              fontWeight: 700,
              color: CERT_COLORS.navy,
              textAlign: "center",
              letterSpacing: 0.4 * s,
              lineHeight: 1.4,
              marginTop: -1 * s,
            }}
          >
            CONSTRUCTION LTD.
          </Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
          <Image
            src={monogramSrc}
            style={{ width: 30 * s, height: 30 * s, objectFit: "contain", marginTop: 2 * s }}
          />
          {/* Executive office text */}
          <Text
            style={{
              fontSize: 4.6 * s,
              fontFamily: FONT_SANS,
              fontWeight: 700,
              color: CERT_COLORS.navy,
              textAlign: "center",
              letterSpacing: 0.5 * s,
              lineHeight: 1.4,
              marginTop: 1 * s,
            }}
          >
            OFFICE OF THE
          </Text>
          <Text
            style={{
              fontSize: 4.4 * s,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              color: CERT_COLORS.navy,
              textAlign: "center",
              letterSpacing: 0.4 * s,
              lineHeight: 1.4,
              marginTop: -0.5 * s,
            }}
          >
            CHIEF EXECUTIVE
          </Text>
          <Text
            style={{
              fontSize: 3.8 * s,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              color: CERT_COLORS.navy,
              textAlign: "center",
              letterSpacing: 0.3 * s,
              marginTop: 1 * s,
            }}
          >
            VERIFIED &amp; APPROVED
          </Text>
        </View>
      </View>
      {/* GHANA — below the circle, matching reference */}
      <Text
        style={{
          fontSize: 5.4 * s,
          fontFamily: FONT_SANS,
          fontWeight: 700,
          color: CERT_COLORS.navy,
          letterSpacing: 1.5 * s,
          marginTop: 2 * s,
        }}
      >
        • GHANA •
      </Text>
    </View>
  );
}

/** One signature line: dotted rule + name + role. */
export function SignatureBlock({
  label,
  name,
  role,
  align = "left",
  signatureSrc,
}: {
  label: string;
  name: string;
  role: string;
  align?: "left" | "right";
  signatureSrc?: string | null;
}) {
  return (
    <View style={{ flex: 1, alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      <Text
        style={{
          fontSize: 7.2,
          fontFamily: FONT_SANS,
          fontWeight: 600,
          color: CERT_COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: 1.3,
        }}
      >
        {label}
      </Text>
      {/* Handwritten signature image */}
      {signatureSrc ? (
        <View style={{ marginTop: 6, marginBottom: 2 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
          <Image
            src={signatureSrc}
            style={{ width: 90, height: 40, objectFit: "contain" }}
          />
        </View>
      ) : (
        <View style={{ height: 48 }} />
      )}
      <View
        style={{
          width: "100%",
          borderBottomWidth: 0.8,
          borderBottomColor: CERT_COLORS.ink,
        }}
      />
      <Text
        style={{ fontSize: 9.5, fontFamily: FONT_DISPLAY, fontWeight: 600, color: CERT_COLORS.ink, marginTop: 4 }}
      >
        {name}
      </Text>
      <Text style={{ fontSize: 8, fontFamily: FONT_BODY_ITALIC, color: CERT_COLORS.muted, marginTop: 1 }}>
        {role}
      </Text>
    </View>
  );
}

/** Signature row: two SignatureBlocks side by side, seal centred between them. */
export function SignatureRow({
  left,
  right,
  showSeal = true,
}: {
  left: { label: string; name: string; role: string; signatureSrc?: string | null };
  right: { label: string; name: string; role: string; signatureSrc?: string | null };
  showSeal?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 8,
      }}
    >
      <SignatureBlock {...left} />
      {showSeal ? <Seal scale={0.68} /> : null}
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

/** The full certificate stage: watermark, frame, corners, footer, content. */
export function CertificatePage({
  children,
  showFooter = true,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <View style={styles.page}>
      <View style={styles.watermark}>
        <View style={styles.wmRing}>
          <View style={styles.wmRingInner}>
            <Text style={styles.wmText}>AJ</Text>
          </View>
        </View>
        <Text style={styles.wmCaption}>AUTHENTIC J.A. CONSTRUCTION LTD.</Text>
      </View>
      <View style={styles.frameOuter} />
      <View style={styles.frameNavy} />
      <View style={styles.frameHair} />
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      {children}
      {showFooter ? <CertificateFooter /> : null}
    </View>
  );
}