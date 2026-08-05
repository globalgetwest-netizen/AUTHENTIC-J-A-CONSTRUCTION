import type { CSSProperties, ReactNode } from 'react';
import { semanticColors, spacing } from '../tokens';

export interface SpinnerProps {
  /** @default 20 */
  size?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function Spinner({ size = 20, label = 'Loading', className, style }: SpinnerProps): ReactNode {
  return (
    <span
      className={className}
      role="status"
      aria-live="polite"
      style={{ display: 'inline-flex', alignItems: 'center', gap: spacing[2], ...style }}
    >
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2px solid rgba(0,0,0,0.12)',
          borderTopColor: semanticColors.primary,
          display: 'inline-block',
          animation: 'ajac-spin 0.8s linear infinite',
        }}
      />
      {label ? <span>{label}</span> : null}
      <style>{`@keyframes ajac-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}