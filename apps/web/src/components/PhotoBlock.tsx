"use client";

import { useEffect, useRef, useState } from "react";
import { Text } from "@ajac/ui";
import { Icon, type IconName } from "./icons";

interface PhotoBlockProps {
  /** Image slot config from `COMPANY_IMAGES`. Missing file → branded panel. */
  image: { src: string | null; alt: string };
  /** Section label shown on the branded fallback / photo overlay. */
  label?: string;
  /** Glyph used on the branded fallback. */
  icon?: IconName;
  className?: string;
}

/**
 * Renders a photographic slot. The branded panel is always the base layer and the
 * photo fades in on top only once it has actually loaded, so a missing file never
 * shows a broken image. Drop a real photo at the documented `public/company/…`
 * path and it appears with no code change.
 */
export function PhotoBlock({ image, label, icon = "building", className = "" }: PhotoBlockProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const showPhoto = Boolean(image.src);

  // If the image was already cached/loaded before React attached `onLoad`,
  // the load event never re-fires and the photo would stay invisible at
  // opacity-0. Detect that case on mount and reveal it.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-lg bg-gradient-to-br from-blue-950 via-blue-900 to-green-950 p-8 text-center ring-1 ring-white/10 ${className}`}
    >
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={image.src ?? ""}
          alt={image.alt}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {!loaded && (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-brand-gold">
            <Icon name={icon} className="h-7 w-7" />
          </span>
          <Text color="surface" weight="semibold">
            {label ?? image.alt}
          </Text>
          <span aria-hidden className="h-0.5 w-12 rounded-full bg-brand-gold" />
        </>
      )}

      {loaded && label && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12">
          <Text color="surface" weight="semibold" size="sm">
            {label}
          </Text>
        </div>
      )}
    </div>
  );
}
