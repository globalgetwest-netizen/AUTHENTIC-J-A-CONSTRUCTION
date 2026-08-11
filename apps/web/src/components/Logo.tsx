"use client";

import { useState } from "react";
import { COMPANY_LOGO } from "../config/company";

const CANDIDATES = [COMPANY_LOGO.src, ...COMPANY_LOGO.candidates];

/**
 * Official company logo with config-driven drop-in and graceful fallback.
 *
 * Drop a logo at the path documented in `COMPANY_LOGO.src` (`public/brand/`)
 * and it renders site-wide — no code change. If the file is missing the
 * component tries legacy filenames; when all fail, a neutral "AJ.A"
 * wordmark renders instead.
 */
export function Logo({ width = 60, inverted = false, src: override }: { width?: number; inverted?: boolean; src?: string }) {
  const [attempt, setAttempt] = useState(0);
  const base = override ? [override, ...CANDIDATES] : CANDIDATES;
  const src = base[attempt];
  const exhausted = attempt >= base.length;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg"
      style={{
        width,
        height: width,
        background: inverted ? "rgba(255,255,255,0.08)" : "#ffffff",
        boxShadow: inverted ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {exhausted ? (
        <span
          className="font-display font-extrabold tracking-wide"
          style={{
            fontSize: Math.round(width * 0.26),
            color: inverted ? "#ffffff" : "#0047AB",
          }}
        >
          AJ.A
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={COMPANY_LOGO.alt}
          className="h-full w-full object-contain"
          style={{
            maskImage:
              "radial-gradient(ellipse 100% 100% at center, black 65%, transparent 92%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at center, black 65%, transparent 92%)",
          }}
          onError={() => setAttempt((a) => a + 1)}
        />
      )}
    </span>
  );
}
