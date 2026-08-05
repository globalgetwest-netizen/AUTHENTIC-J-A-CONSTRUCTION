import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { maxWidths, radii, semanticColors, shadows } from '../tokens';

export const breakpointsPx = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Whether the app currently renders at/above a breakpoint (client-side check). */
export function isViewportAtLeast(bp: keyof typeof breakpointsPx, width: number): boolean {
  return width >= breakpointsPx[bp];
}

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Named bound, or a raw max-width. @default 'container' */
  width?: keyof typeof maxWidths | string;
  /** Horizontal padding step. @default 6 */
  padding?: number;
  style?: CSSProperties;
}

export function Container({
  children,
  width = 'container',
  padding = 6,
  style,
  ...rest
}: ContainerProps): ReactNode {
  const max =
    width in maxWidths ? maxWidths[width as keyof typeof maxWidths] : width;
  return (
    <div
      {...rest}
      style={{ margin: '0 auto', maxWidth: max, paddingInline: padding / 4, ...style }}
    >
      {children}
    </div>
  );
}

export function Surface({ children, style, ...rest }: { children: ReactNode; style?: CSSProperties } & HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      {...rest}
      style={{ background: semanticColors.surface, borderRadius: radii.lg, boxShadow: shadows.md, ...style }}
    >
      {children}
    </div>
  );
}