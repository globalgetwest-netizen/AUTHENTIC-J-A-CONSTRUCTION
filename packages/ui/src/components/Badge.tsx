import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { colors, radii, semanticColors, spacing, fontSizes, fontWeights } from '../tokens';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  children: ReactNode;
  tone?: BadgeTone;
  /** Soft (tinted) background instead of solid. @default false */
  soft?: boolean;
  style?: CSSProperties;
}

const solidBg: Record<BadgeTone, string> = {
  neutral: semanticColors.muted,
  brand: semanticColors.primary,
  success: semanticColors.success,
  warning: semanticColors.warning,
  danger: semanticColors.danger,
  info: semanticColors.info,
};

const softBg: Record<BadgeTone, { background: string; color: string }> = {
  neutral: { background: colors.neutral[100], color: colors.neutral[700] },
  brand: { background: colors.green[100], color: colors.green[800] },
  success: { background: colors.green[100], color: colors.green[700] },
  warning: { background: '#FDF3E0', color: '#92400E' },
  danger: { background: colors.red[100], color: colors.red[800] },
  info: { background: colors.blue[100], color: colors.blue[800] },
};

export function Badge({ children, tone = 'neutral', soft = false, style, ...rest }: BadgeProps): ReactNode {
  const palette = soft ? softBg[tone] : { background: solidBg[tone], color: '#FFFFFF' };
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[1.5],
        borderRadius: radii.full,
        padding: `${spacing[0.5]} ${spacing[2]}`,
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        ...palette,
        ...style,
      }}
    >
      {children}
    </span>
  );
}