import { Text } from "@ajac/ui";
import { Icon, type IconName } from "./icons";

interface PhotoBlockProps {
  /** Image slot config from `COMPANY_IMAGES`. `src: null` → branded panel. */
  image: { src: string | null; alt: string };
  /** Section label shown on the branded fallback. */
  label?: string;
  /** Glyph used on the branded fallback. */
  icon?: IconName;
  className?: string;
}

/**
 * Renders a photographic slot. When `image.src` is set the photo fills the block
 * with an optional label overlay; when it's `null` (asset not supplied yet) a
 * refined brand panel renders instead — real imagery drops in via config with no
 * code change, and sections never show a broken image or a fake photo.
 */
export function PhotoBlock({ image, label, icon = "building", className = "" }: PhotoBlockProps) {
  if (image.src) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
        {label && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12">
            <Text color="surface" weight="semibold" size="sm">
              {label}
            </Text>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 overflow-hidden rounded-lg bg-gradient-to-br from-blue-950 via-blue-900 to-green-950 p-8 text-center ring-1 ring-white/10 ${className}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-brand-gold">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <Text color="surface" weight="semibold">{label ?? image.alt}</Text>
      <span aria-hidden className="h-0.5 w-12 rounded-full bg-brand-gold" />
    </div>
  );
}