import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { semanticColors } from '../tokens';

export interface DividerProps extends Omit<HTMLAttributes<HTMLHRElement>, 'style'> {
  /** @default 'muted' */
  tone?: 'muted' | 'strong';
  style?: CSSProperties;
}

export function Divider({ tone = 'muted', style, ...rest }: DividerProps): ReactNode {
  return (
    <hr
      {...rest}
      style={{
        height: 1,
        border: 'none',
        background: tone === 'strong' ? semanticColors.border : semanticColors.borderMuted,
        margin: 0,
        ...style,
      }}
    />
  );
}