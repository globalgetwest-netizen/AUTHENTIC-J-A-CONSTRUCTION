import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { durations, radii, semanticColors, spacing, fontSizes, fontWeights, shadows } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeMap: Record<ButtonSize, CSSProperties> = {
  sm: { padding: `${spacing[1.5]} ${spacing[3]}`, fontSize: fontSizes.sm },
  md: { padding: `${spacing[2]} ${spacing[4]}`, fontSize: fontSizes.base },
  lg: { padding: `${spacing[3]} ${spacing[6]}`, fontSize: fontSizes.base },
};

function variantStyle(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: semanticColors.primary, color: semanticColors.primaryForeground };
    case 'secondary':
      return { background: semanticColors.secondary, color: semanticColors.secondaryForeground };
    case 'outline':
      return {
        background: 'transparent',
        color: semanticColors.primary,
        border: `1px solid ${semanticColors.primary}`,
      };
    case 'ghost':
      return { background: 'transparent', color: semanticColors.primary };
    case 'danger':
      return { background: semanticColors.danger, color: semanticColors.dangerForeground };
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps): ReactNode {
  const isDisabled = disabled ?? loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderRadius: radii.md,
        fontWeight: fontWeights.semibold,
        lineHeight: 1.25,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: `background ${durations.fast}, border-color ${durations.fast}, opacity ${durations.fast}`,
        boxShadow: shadows.sm,
        width: fullWidth ? '100%' : undefined,
        ...sizeMap[size],
        ...variantStyle(variant),
        ...style,
      }}
    >
      {loading && <Spin aria-hidden />}
      {children}
    </button>
  );
}

function Spin({ style }: { style?: CSSProperties }): ReactNode {
  return (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        display: 'inline-block',
        animation: 'ajac-spin 0.7s linear infinite',
        ...style,
      }}
    />
  );
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Button styled as an anchor for navigation CTAs (href + same visual language). */
export function ButtonLink({ children, variant = 'primary', size = 'md', style, ...rest }: ButtonLinkProps): ReactNode {
  const v = variantStyle(variant);
  if (variant === 'outline') v.border = `1px solid ${semanticColors.primary}`;
  return (
    <a
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderRadius: radii.md,
        fontWeight: fontWeights.semibold,
        lineHeight: 1.25,
        textDecoration: 'none',
        cursor: 'pointer',
        boxShadow: shadows.sm,
        ...sizeMap[size],
        ...v,
        ...style,
      }}
    >
      {children}
    </a>
  );
}