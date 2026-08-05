import type { CSSProperties, ReactNode } from 'react';
import { colors, fontFamilies, radii } from '../tokens';

export interface BrandMarkProps {
  /** @default 96 */
  size?: number;
  className?: string;
  /** Render for dark backgrounds. @default false */
  inverted?: boolean;
  style?: CSSProperties;
}

/**
 * AJ.A brand mark.
 *
 * PLACEHOLDER SLOT — the official logo supplied by the company has not been
 * committed yet (see `apps/web/public/brand/README.md`). This renders a neutral
 * wordmark so layouts can be built now; it is swapped for the official asset
 * (unchanged in intent) as soon as the asset is dropped in. Do NOT generate or
 * redesign the official logo.
 */
export function BrandMark({ size = 96, className, inverted = false, style }: BrandMarkProps): ReactNode {
  const root: CSSProperties = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    background: inverted ? 'rgba(255,255,255,0.08)' : 'rgba(11,59,46,0.06)',
    color: inverted ? colors.white : colors.green[700],
    fontFamily: fontFamilies.display,
    fontWeight: 700,
    fontSize: Math.round(size * 0.22),
    letterSpacing: '0.02em',
    userSelect: 'none',
    ...style,
  };
  return (
    <span
      className={className}
      style={root}
      role="img"
      aria-label="AUTHENTIC J.A. CONSTRUCTION LTD."
    >
      AJ.A
    </span>
  );
}