'use client';

import { useState } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { radii, semanticColors, shadows, spacing } from '../tokens';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children: ReactNode;
  /** Lift on hover. @default false */
  interactive?: boolean;
  /** Remove default padding, letting children control the grid. @default false */
  flush?: boolean;
  /** Padding step from the spacing scale. @default 6 */
  padding?: keyof typeof spacing;
  style?: CSSProperties;
}

export function Card({
  children,
  interactive = false,
  flush = false,
  padding = 6,
  style,
  ...rest
}: CardProps): ReactNode {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      {...rest}
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      style={{
        background: semanticColors.surface,
        border: `1px solid ${semanticColors.borderMuted}`,
        borderRadius: radii.lg,
        boxShadow: hovered ? shadows.lg : shadows.md,
        transform: hovered ? 'translateY(-2px)' : 'none',
        padding: flush ? 0 : spacing[padding],
        transition: 'box-shadow 200ms, transform 200ms',
        ...(interactive ? { cursor: 'pointer' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}