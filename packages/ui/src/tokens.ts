/**
 * AUTHENTIC J.A. CONSTRUCTION LTD. — design tokens (canonical source of truth).
 *
 * The palette anchors on the four colors in the company's official logo and
 * signboard: royal blue `#0047AB` (primary), brand green `#00A651`, action red
 * `#D32F2F`, and gold `#FFD700` (highlight). These values drive:
 *   - the web app via `tokens.css` (CSS custom properties) + Tailwind `@theme`
 *   - the mobile app via `apps/mobile/src/constants/theme.ts`
 *   - every `@ajac/ui` primitive (inline styles)
 *
 * Do not hand-edit surfaces in an app; change the canonical value here, then the
 * CSS projection in `tokens.css` the same value.
 */

export const colors = {
  /** Royal blue — the brand primary (right "A" + wordmark in the logo). */
  blue: {
    50: '#EDF2FB',
    100: '#D6E2F6',
    200: '#ADC6EE',
    300: '#7FA3E2',
    400: '#4C7CCF',
    500: '#1E5BB9',
    600: '#0047AB',
    700: '#003A8E',
    800: '#002E70',
    900: '#002254',
    950: '#001736',
  },
  /** Brand green — the left "A" in the logo; success/secondary. */
  green: {
    50: '#E8F8F0',
    100: '#C7EFD9',
    200: '#90E0B8',
    300: '#54CC93',
    400: '#22B970',
    500: '#00A651',
    600: '#008C42',
    700: '#006B33',
    800: '#004E26',
    900: '#00351B',
    950: '#002412',
  },
  /** Action red — the logo swoosh, signboard SERVICES/CONTACTS, danger. */
  red: {
    50: '#FCEBEC',
    100: '#F8D0D1',
    200: '#F0A1A4',
    300: '#E67073',
    400: '#DD4B4E',
    500: '#D32F2F',
    600: '#B0211F',
    700: '#8F1D1B',
    800: '#6F1A18',
    900: '#511716',
    950: '#3A1010',
  },
  /** Brand gold — "AUTHENTIC J.A" on the signboard; highlight. */
  yellow: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FFD700',
    500: '#FFC107',
    600: '#F59E0B',
    700: '#D97706',
    800: '#B45309',
    900: '#92400E',
    950: '#78350F',
  },
  /** Charcoal / off-white neutrals. */
  neutral: {
    50: '#F7F9FA',
    100: '#EEF1F3',
    200: '#DCE2E6',
    300: '#C3CBD2',
    400: '#9AA4AD',
    500: '#7A868F',
    600: '#5B6670',
    700: '#3B424A',
    800: '#23292F',
    900: '#1A1F24',
    950: '#121212',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorScale = keyof typeof colors;

export interface SemanticColors {
  background: string;
  foreground: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderMuted: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerHover: string;
  dangerForeground: string;
  info: string;
  infoForeground: string;
  muted: string;
  mutedForeground: string;
}

export const semanticColors: SemanticColors = {
  background: colors.neutral[50],
  foreground: colors.neutral[950],
  surface: colors.white,
  surfaceMuted: colors.neutral[100],
  border: colors.neutral[200],
  borderMuted: colors.neutral[100],
  primary: colors.blue[600],
  primaryHover: colors.blue[700],
  primaryActive: colors.blue[800],
  primaryForeground: colors.white,
  secondary: colors.green[600],
  secondaryHover: colors.green[700],
  secondaryForeground: colors.white,
  accent: colors.yellow[500],
  accentForeground: colors.blue[950],
  success: colors.green[600],
  successForeground: colors.white,
  warning: colors.yellow[700],
  warningForeground: colors.white,
  danger: colors.red[500],
  dangerHover: colors.red[600],
  dangerForeground: colors.white,
  info: colors.blue[500],
  infoForeground: colors.white,
  muted: colors.neutral[600],
  mutedForeground: colors.neutral[500],
};

export interface FontFamilies {
  sans: string;
  display: string;
  mono: string;
}

/** CSS font-family stacks. Web injects its bundled webfont via --font-geist-*;
 *  tokens.css keeps display/mono portable, so these are usable by any consumer. */
export const fontFamilies: FontFamilies = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  display: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

export interface FontSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
}

export const fontSizes: FontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75,
} as const;

export const letterSpacings = {
  tightest: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.2em',
} as const;

/** Spacing scale — 4px grid (0.25rem), matching Tailwind's default so utilities
 *  and primitives stay aligned. Keyed by the visual step name. */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

export const radii = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(18, 22, 26, 0.06)',
  md: '0 2px 6px rgba(18, 22, 26, 0.05), 0 8px 24px rgba(18, 22, 26, 0.08)',
  lg: '0 12px 32px rgba(18, 22, 26, 0.12)',
  none: 'none',
} as const;

export const zIndex = {
  base: 0,
  sticky: 10,
  overlay: 20,
  modal: 30,
  popover: 40,
  toast: 50,
} as const;

export const durations = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
} as const;

export const maxWidths = {
  prose: '65ch',
  container: '80rem',
  wide: '96rem',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const tokens = {
  colors,
  semanticColors,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  spacing,
  radii,
  shadows,
  zIndex,
  durations,
  maxWidths,
  breakpoints,
} as const;