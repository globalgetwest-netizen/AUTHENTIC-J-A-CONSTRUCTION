import type { CSSProperties, ElementType, ReactNode } from 'react';
import {
  colors,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  semanticColors,
} from '../tokens';

type Color = 'white' | 'black' | 'foreground' | 'muted' | 'primary' | 'surface';

const colorValue = (c: Color | undefined): string => {
  switch (c) {
    case 'foreground':
      return semanticColors.foreground;
    case 'muted':
      return semanticColors.muted;
    case 'primary':
      return semanticColors.primary;
    case 'surface':
      // Text placed on the deep green brand background renders white.
      return semanticColors.primaryForeground;
    case 'white':
      return colors.white;
    case 'black':
      return colors.black;
    default:
      return semanticColors.foreground;
  }
};

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps {
  children: ReactNode;
  level?: HeadingLevel;
  /** Named type-scale step. Defaults per level. */
  size?: keyof typeof fontSizes;
  color?: Color;
  className?: string;
  style?: CSSProperties;
}

const levelSize: Record<HeadingLevel, keyof typeof fontSizes> = {
  1: '4xl',
  2: '3xl',
  3: '2xl',
  4: 'xl',
  5: 'base',
  6: 'base',
};

const levelElement: Record<HeadingLevel, ElementType> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

export function Heading({
  children,
  level = 2,
  size = levelSize[level],
  color,
  className,
  style,
}: HeadingProps): ReactNode {
  const Tag = levelElement[level];
  const tracked = size === 'xl' || size === '2xl' || size === '3xl' || size === '4xl' || size === '5xl' || size === '6xl';
  return (
    <Tag
      className={className}
      style={{
        fontSize: fontSizes[size],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
        letterSpacing: tracked ? letterSpacings.tight : letterSpacings.normal,
        color: colorValue(color),
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export interface TextProps {
  children: ReactNode;
  size?: keyof typeof fontSizes;
  as?: 'p' | 'span' | 'div' | 'label';
  weight?: keyof typeof fontWeights;
  color?: Color;
  line?: number;
  letterSpacing?: keyof typeof letterSpacings;
  className?: string;
  style?: CSSProperties;
}

export function Text({
  children,
  size = 'base',
  as: Tag = 'p',
  weight = 'regular',
  color,
  line = 1.625,
  letterSpacing = 'normal',
  className,
  style,
}: TextProps): ReactNode {
  return (
    <Tag
      className={className}
      style={{
        fontSize: fontSizes[size],
        fontWeight: fontWeights[weight],
        lineHeight: line,
        letterSpacing: letterSpacings[letterSpacing],
        color: colorValue(color),
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export interface KickerProps {
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

/** Small tracked uppercase eyebrow label used above headings. */
export function Kicker({ children, color = semanticColors.accent, className, style }: KickerProps): ReactNode {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.semibold,
        letterSpacing: letterSpacings.widest,
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}