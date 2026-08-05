"use client";

import { useState } from "react";

/**
 * The official company logo (`/brand/ajac-logo.jpg`). Renders the image, falling
 * back to the neutral "AJ.A" wordmark only if the asset is missing — so headers
 * and footers never show a broken image.
 */
export function Logo({ width = 48, inverted = false }: { width?: number; inverted?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-black/5"
      style={{ width, height: width * 0.78 }}
    >
      {failed ? (
        <span
          className="font-display font-extrabold tracking-wide"
          style={{ fontSize: Math.round(width * 0.26), color: inverted ? "#ffffff" : "#0047AB" }}
        >
          AJ.A
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/ajac-logo.jpg"
          alt="AUTHENTIC J.A. CONSTRUCTION LTD. logo"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}