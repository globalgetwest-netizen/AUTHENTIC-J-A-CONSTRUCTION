import { Image, Text, View } from "@react-pdf/renderer";
import { LETTERHEAD } from "@/config/documents";

export const DOC_COLORS = {
  blue: "#0047AB",
  green: "#00A651",
  charcoal: "#1f2937",
  muted: "#6b7280",
  border: "#d1d5db",
  light: "#f9fafb",
};

/**
 * Company letterhead for generated PDFs. Renders the full letterhead image
 * when `letterheadImage` is configured; otherwise composes a clean text header
 * (logo, registered name, Reg No / TIN, contact band) from the config.
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

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {logoSrc ? (
          /* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF <Image> has no alt support */
          <Image src={logoSrc} style={{ width: 56, height: 56, objectFit: "contain" }} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: DOC_COLORS.blue,
              textTransform: "uppercase",
            }}
          >
            {LETTERHEAD.name}
          </Text>
          <Text style={{ fontSize: 8, color: DOC_COLORS.muted, marginTop: 3 }}>
            Reg No. {LETTERHEAD.registrationNo}  |  TIN: {LETTERHEAD.taxId}
          </Text>
          <Text style={{ fontSize: 8, color: DOC_COLORS.muted, marginTop: 1, fontStyle: "italic" }}>
            {LETTERHEAD.tagline}
          </Text>
        </View>
      </View>
      <View
        style={{
          marginTop: 8,
          borderTopWidth: 2,
          borderTopColor: DOC_COLORS.green,
          paddingTop: 6,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 8, color: DOC_COLORS.charcoal }}>{LETTERHEAD.headOffice}</Text>
        <Text style={{ fontSize: 8, color: DOC_COLORS.muted }}>{phoneLine}</Text>
        <Text style={{ fontSize: 8, color: DOC_COLORS.muted }}>Email: {LETTERHEAD.email}</Text>
        {LETTERHEAD.website ? (
          <Text style={{ fontSize: 8, color: DOC_COLORS.muted }}>{LETTERHEAD.website}</Text>
        ) : null}
      </View>
    </View>
  );
}
