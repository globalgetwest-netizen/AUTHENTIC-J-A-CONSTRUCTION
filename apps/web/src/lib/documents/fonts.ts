import { Font } from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Premium type stack for all generated documents.
 *
 *   Playfair Display — high-contrast display serif (titles, names, headings)
 *   EB Garamond     — timeless book serif (intro copy, table values, signatures)
 *   Inter           — refined grotesque sans (labels, small-caps, data, footers)
 *
 * Fonts are real TTFs shipped in `public/fonts/` (sourced from Fontsource,
 * OFL-licensed). They are registered once, server-side, and embedded into the
 * rendered PDF — every viewer renders the identical letterforms.
 *
 * `readFileSync` at module scope is safe: this module is only ever imported by
 * the certificate/document components, which are loaded lazily inside the
 * server-only `render*Pdf()` functions in `lib/documents/pdf.ts`.
 */

export const FONT_DISPLAY = "Playfair Display";
export const FONT_BODY = "EB Garamond";
export const FONT_SANS = "Inter";

/** A registered single-weight family so legacy `fontFamily:` usages keep working. */
export const FONT_BODY_BOLD = "EB Garamond Bold";
/** A registered italic single-weight family for notes and bylines. */
export const FONT_BODY_ITALIC = "EB Garamond Italic";

function ttf(name: string) {
  const buffer = readFileSync(join(process.cwd(), "public", "fonts", name));
  return {
    src: `data:font/ttf;base64,${buffer.toString("base64")}`,
  };
}

Font.register({
  family: FONT_DISPLAY,
  fonts: [
    { ...ttf("playfair-display-600.ttf"), fontWeight: 600 },
    { ...ttf("playfair-display-700.ttf"), fontWeight: 700 },
  ],
});

Font.register({
  family: FONT_BODY,
  fonts: [
    { ...ttf("eb-garamond-400.ttf"), fontWeight: 400 },
    { ...ttf("eb-garamond-500.ttf"), fontWeight: 500 },
    { ...ttf("eb-garamond-600.ttf"), fontWeight: 600 },
    { ...ttf("eb-garamond-700.ttf"), fontWeight: 700 },
    { ...ttf("eb-garamond-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
  ],
});

Font.register({
  family: FONT_SANS,
  fonts: [
    { ...ttf("inter-400.ttf"), fontWeight: 400 },
    { ...ttf("inter-500.ttf"), fontWeight: 500 },
    { ...ttf("inter-600.ttf"), fontWeight: 600 },
    { ...ttf("inter-700.ttf"), fontWeight: 700 },
  ],
});

// Legacy single-weight aliases — keep `CERT_FONT_BOLD` / `CERT_FONT_ITALIC`
// resolving to genuinely bold / italic faces without touching call sites.
Font.register({
  family: FONT_BODY_BOLD,
  fonts: [{ ...ttf("eb-garamond-700.ttf") }],
});

Font.register({
  family: FONT_BODY_ITALIC,
  fonts: [{ ...ttf("eb-garamond-italic.ttf") }],
});
