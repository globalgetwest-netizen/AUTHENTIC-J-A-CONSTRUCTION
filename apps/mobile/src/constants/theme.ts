/**
 * AUTHENTIC J.A. CONSTRUCTION LTD. — mobile design tokens.
 *
 * Colors and spacing are re-exported from the shared canonical design system
 * (`@ajac/ui/tokens`) so web and mobile stay on one source of truth. Only the
 * React-Native surface layer (light/dark, per-platform fonts) is defined here.
 */
import { Platform } from 'react-native';
import { colors, fontFamilies, fontSizes, radii, semanticColors } from '@ajac/ui/tokens';

export const Colors = {
  light: {
    text: semanticColors.foreground,
    background: semanticColors.background,
    backgroundElement: semanticColors.surfaceMuted,
    backgroundSelected: colors.neutral[200],
    textSecondary: semanticColors.muted,
  },
  dark: {
    text: colors.white,
    background: colors.neutral[950],
    backgroundElement: colors.neutral[800],
    backgroundSelected: colors.neutral[700],
    textSecondary: colors.neutral[400],
  },
  brand: {
    blue: colors.blue[600],
    green: colors.green[500],
    green600: colors.green[600],
    blue500: colors.blue[500],
    red: colors.red[500],
    gold: colors.yellow[400],
    charcoal: colors.neutral[800],
    offWhite: colors.neutral[50],
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: fontFamilies.sans,
    serif: fontFamilies.display,
    rounded: 'ui-rounded',
    mono: fontFamilies.mono,
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Convert a CSS length token ("0.75rem", "1rem", "9999px") to px so React
 *  Native accepts it as a numeric dimension. */
function toPx(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)(rem|px)$/.exec(value.trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2] === 'rem' ? Math.round(amount * 16) : amount;
}

export const Type = {
  xs: toPx(fontSizes.xs),
  sm: toPx(fontSizes.sm),
  base: toPx(fontSizes.base),
  lg: toPx(fontSizes.lg),
  xl: toPx(fontSizes.xl),
  '2xl': toPx(fontSizes['2xl']),
  '3xl': toPx(fontSizes['3xl']),
  '4xl': toPx(fontSizes['4xl']),
} as const;

export const Radii = {
  sm: toPx(radii.sm),
  md: toPx(radii.md),
  lg: toPx(radii.lg),
  xl: toPx(radii.xl),
  full: toPx(radii.full),
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;