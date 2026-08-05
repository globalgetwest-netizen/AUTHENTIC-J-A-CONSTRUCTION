import type { CSSProperties, ReactNode } from 'react';

export interface StackProps {
  children: ReactNode;
  /** @default 'column' */
  direction?: 'row' | 'column';
  /** @default true */
  wrap?: boolean;
  /** Gap step from the spacing scale. @default 4 */
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  className?: string;
  style?: CSSProperties;
}

/** Flex layout helper. gap uses the 4px spacing grid via a caller-provided map. */
export function Stack({
  children,
  direction = 'column',
  wrap = true,
  gap = 4,
  align,
  justify,
  className,
  style,
}: StackProps): ReactNode {
  const gapPx = gap * 4;
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: gapPx,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
}