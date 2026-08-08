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
 * Company letterhead for generated PDFs. Renders the full letterhead image
 * when `letterheadImage` is configured; otherwise composes a premium brand
 * lockup (logo, Playfair-registered name on a gold rule, EB Garamond tagline,
 * registry details and a gold contact band) from the config.
 */
export function Letterhead({
  logoSrc,
  letterheadSrc,
}: {
  logoSrc?: string | null;
  letterheadSrc?: string | null;
}) {
  if (letterheadSrc) {
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
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {logoSrc ? (
          /* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */
          <Image src={logoSrc} style={{ width: 62, height: 62, objectFit: "contain" }} />
        ) : null}
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