import { ImageResponse } from "next/og";

export const contentType = "image/svg+xml";
export const size = { width: 32, height: 32 };
export const alt = "AJA";

/**
 * Dynamic SVG favicon — the AJA logomark rendered at any resolution.
 * Next.js caches this at build/dev time; browsers request it as /icon.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
        {/* Green A (left) */}
        <path d="M40 400 L170 80 L200 80 L330 400 L280 400 L250 320 L120 320 L90 400 Z" fill="#00A651" />
        <path d="M135 280 L235 280 L185 170 Z" fill="white" />

        {/* Red J (center) with arch/swoosh */}
        <path d="M290 80 L340 80 L340 280 C340 330 310 360 260 360 L260 320 C290 320 300 310 300 280 L290 80 Z" fill="#E31937" />
        <path d="M260 220 C280 140 380 80 500 100 C460 80 360 90 290 160 Z" fill="#E31937" />

        {/* Blue A (right) */}
        <path d="M420 400 L550 80 L580 80 L710 400 L660 400 L630 320 L500 320 L470 400 Z" fill="#1A3C8F" />
        <path d="M515 280 L615 280 L565 170 Z" fill="white" />
      </svg>
    ),
    // ImageResponse options — pass width/height only; `icon` is not a valid
    // option (the file-convention <app>/icon.tsx route makes it the favicon).
    { ...size },
  );
}
