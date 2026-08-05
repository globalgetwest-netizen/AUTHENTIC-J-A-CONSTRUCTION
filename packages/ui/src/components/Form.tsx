import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { colors, fontSizes, radii, semanticColors, spacing } from '../tokens';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, style, ...rest }: InputProps): ReactNode {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: fontSizes.base,
        color: semanticColors.foreground,
        background: semanticColors.surface,
        border: `1px solid ${invalid ? semanticColors.danger : semanticColors.border}`,
        borderRadius: radii.md,
        transition: 'border-color 150ms, box-shadow 150ms',
        outline: 'none',
        boxShadow: invalid ? `0 0 0 3px ${colors.red[100]}` : undefined,
        ...style,
      }}
    />
  );
}

export interface FieldProps {
  label: string;
  /** ReactNode so any live/help text (Text, Kicker, plain string) can be used. */
  children: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  /** Hidden label for purely visual fields. @default false */
  srOnly?: boolean;
}

export function Field({ label, children, hint, error, htmlFor, srOnly = false }: FieldProps): ReactNode {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const describedBy = hint || error ? `${id}-hint` : undefined;
  return (
    <div style={{ display: 'grid', gap: spacing[1.5] }}>
      <label
        htmlFor={id}
        style={srOnly
          ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }
          : { fontSize: fontSizes.sm, fontWeight: 600, color: semanticColors.foreground }}
      >
        {label}
      </label>
      {children}
      {hint || error ? (
        <span
          id={describedBy}
          style={{
            fontSize: fontSizes.xs,
            color: error ? semanticColors.danger : semanticColors.muted,
          }}
        >
          {error ?? hint}
        </span>
      ) : null}
    </div>
  );
}