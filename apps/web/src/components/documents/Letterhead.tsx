import { Image, Text, View } from "@react-pdf/renderer";
import { LETTERHEAD } from "@/config/documents";
import { FONT_BODY, FONT_DISPLAY, FONT_SANS } from "@/lib/documents/fonts";

export const DOC_COLORS = {
  blue: "#0047AB",
  green: "#00A651",
  gold: "#C2A15B",
  goldDeep: "#8E6D22",
  charcoal: "#26303B",
  navy: "#14324F",
  muted: "#5B6674",
  border: "#DAD0B8",
  light: "#FAF5EA",
};

/**
 * Company letterhead for generated PDFs.
 *
 * The real letterheads (`letterheadImage`, `ceoLetterheadImage`) are complete
 * A4 page designs — header band on top, watermark in the body, footer band at
 * the bottom. They are rendered one of two ways depending on the document:
 *
 * - `fullPage`  → the image becomes a fixed full-page background (repeats on
 *   later pages like printed letterhead paper). The template must give the
 *   content enough top/bottom padding to clear the header/footer bands, and
 *   must suppress its own footer (the letterhead already carries one).
 * - `bandHeight` → the top of the image is cropped to a header band for
 *   documents that keep their own footer decoration (e.g. company profile).
 *
 * When `letterheadSrc` is null a premium text lockup is composed from config
 * (logo, Playfair-registered name on a gold rule, tagline, contacts band) —
 * this is the band certificates use.
 */
export function Letterhead({
  logoSrc,
  letterheadSrc,
  fullPage = false,
  bandHeight,
}: {
  logoSrc?: string | null;
  letterheadSrc?: string | null;
  /** Render the letterhead as a fixed full-page background behind the content. */
  fullPage?: boolean;
  /** Instead of the whole page, crop the letterhead to a header band of this height. */
  bandHeight?: number;
}) {
  if (letterheadSrc) {
    if (fullPage) {
      return (
        <View
          fixed
          debug={false}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
          <Image src={letterheadSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </View>
      );
    }
    if (bandHeight) {
      return (
        <View style={{ height: bandHeight, overflow: "hidden", marginBottom: 16 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
          <Image src={letterheadSrc} style={{ width: "100%", objectFit: "contain" }} />
        </View>
      );
    }
    return (
      <View style={{ marginBottom: 24 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
        <Image src={letterheadSrc} style={{ width: "100%", objectFit: "contain" }} />
      </View>
    );
  }

  const phoneLine = LETTERHEAD.phones
    .map((phone, i) => `${LETTERHEAD.phoneLabels[i] ?? "Tel"}: ${phone}`)
    .join("   |   ");

  const contacts: string[] = [
    LETTERHEAD.headOffice,
    phoneLine,
    `Email: ${LETTERHEAD.email}`,
    ...(LETTERHEAD.website ? [LETTERHEAD.website] : []),
  ];

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */}
        <Image
          src={logoSrc || LETTERHEAD.logo}
          style={{ width: 52, height: 52, objectFit: "contain" }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16.5,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              color: DOC_COLORS.navy,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            {LETTERHEAD.name}
          </Text>
          <View
            style={{
              marginTop: 5,
              width: 96,
              height: 1.5,
              backgroundColor: DOC_COLORS.gold,
            }}
          />
          <Text
            style={{
              fontSize: 9,
              fontFamily: FONT_BODY,
              fontStyle: "italic",
              color: DOC_COLORS.muted,
              marginTop: 4,
            }}
          >
            {LETTERHEAD.tagline}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 7.2, fontFamily: FONT_SANS, fontWeight: 500, color: DOC_COLORS.muted, letterSpacing: 0.3 }}>
            Reg No. {LETTERHEAD.registrationNo}
          </Text>
          <Text style={{ fontSize: 7.2, fontFamily: FONT_SANS, fontWeight: 500, color: DOC_COLORS.muted, letterSpacing: 0.3 }}>
            TIN: {LETTERHEAD.taxId}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          borderTopWidth: 1.2,
          borderTopColor: DOC_COLORS.gold,
          borderBottomWidth: 0.6,
          borderBottomColor: DOC_COLORS.goldDeep,
          paddingVertical: 5,
        }}
      >
        <Text style={{ fontSize: 6.6, fontFamily: FONT_SANS, fontWeight: 500, color: DOC_COLORS.muted }}>
          {contacts.join("  ·  ")}
        </Text>
      </View>
    </View>
  );
}