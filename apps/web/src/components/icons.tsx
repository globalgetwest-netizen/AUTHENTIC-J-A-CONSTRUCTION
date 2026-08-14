import type { SVGProps } from "react";

/** SVG props minus `name` (an SVG attribute) so our discriminator `name`
 *  prop can't be clobbered by a rest-spread. */
type SvgProps = Omit<SVGProps<SVGSVGElement>, "name">;

/** Brand platforms rendered as glyphs (subset of IconName). */
type BrandName =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "youtube"
  | "linkedin";

export type IconName =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "youtube"
  | "linkedin"
  | "architectural"
  | "pillar"
  | "sandstone"
  | "building"
  | "civil"
  | "land"
  | "phone"
  | "mail"
  | "clock"
  | "pin"
  | "upload"
  | "check"
  | "alert"
  | "send"
  | "menu"
  | "close"
  | "chat"
  | "chevron-left"
  | "chevron-right";

interface IconShellProps extends SvgProps {
  children: React.ReactNode;
}

function IconShell({ children, ...props }: IconShellProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function BrandIcon({ name, ...rest }: { name: BrandName } & SvgProps) {
  switch (name) {
    case "facebook":
      return (
        <IconShell {...rest}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </IconShell>
      );
    case "instagram":
      return (
        <IconShell {...rest}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </IconShell>
      );
    case "tiktok":
      return (
        <IconShell {...rest}>
          <path d="M9 12a4 4 0 1 0 4 4V3c.6 2.5 2.4 4 5 4" />
        </IconShell>
      );
    case "whatsapp":
      return (
        <IconShell {...rest}>
          <path d="M3 21l1.65-4.95a8.5 8.5 0 1 1 5.4 5.35L3 21z" />
          <path d="M9 8.5l.8 1.6a4 4 0 0 0 5.1 5.1l1.6.8" />
        </IconShell>
      );
    case "youtube":
      return (
        <IconShell {...rest}>
          <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
          <path d="m10 9 5 3-5 3z" />
        </IconShell>
      );
    case "linkedin":
      return (
        <IconShell {...rest}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v1.5A5 5 0 0 1 16 8z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </IconShell>
      );
    default:
      return null;
  }
}

function ServiceIcon({ name, ...rest }: { name: IconName } & SvgProps) {
  switch (name) {
    case "architectural":
      return (
        <IconShell {...rest}>
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <path d="M3 12h18M12 3v18M3 7h18M3 17h18" />
        </IconShell>
      );
    case "pillar":
      return (
        <IconShell {...rest}>
          <rect x="9" y="2" width="6" height="20" />
          <path d="M4 21h16M6 5h12M6 19h12" />
        </IconShell>
      );
    case "sandstone":
      return (
        <IconShell {...rest}>
          <path d="M3 17c3-6 7-6 9 0M12 17c2-5 6-5 9 0M9 13c2-4 4-4 6 0" />
        </IconShell>
      );
    case "building":
      return (
        <IconShell {...rest}>
          <path d="M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14" />
          <path d="M9 7v2M13 7v2M9 13v2M13 13v2" />
          <path d="M12 21v-4" />
        </IconShell>
      );
    case "civil":
      return (
        <IconShell {...rest}>
          <path d="M2 20h20" />
          <path d="M5 20l7-12 7 12" />
          <path d="M9 20l3-5 3 5" />
        </IconShell>
      );
    case "land":
      return (
        <IconShell {...rest}>
          <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </IconShell>
      );
    default:
      return null;
  }
}

function UiIcon({ name, ...rest }: { name: IconName } & SvgProps) {
  switch (name) {
    case "phone":
      return (
        <IconShell {...rest}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </IconShell>
      );
    case "mail":
      return (
        <IconShell {...rest}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </IconShell>
      );
    case "clock":
      return (
        <IconShell {...rest}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </IconShell>
      );
    case "pin":
      return (
        <IconShell {...rest}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </IconShell>
      );
    case "upload":
      return (
        <IconShell {...rest}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </IconShell>
      );
    case "check":
      return (
        <IconShell {...rest}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </IconShell>
      );
    case "alert":
      return (
        <IconShell {...rest}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </IconShell>
      );
    case "send":
      return (
        <IconShell {...rest}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </IconShell>
      );
    case "menu":
      return (
        <IconShell {...rest}>
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </IconShell>
      );
    case "close":
      return (
        <IconShell {...rest}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </IconShell>
      );
    case "chat":
      return (
        <IconShell {...rest}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </IconShell>
      );
    case "chevron-left":
      return (
        <IconShell {...rest}>
          <path d="m15 18-6-6 6-6" />
        </IconShell>
      );
    case "chevron-right":
      return (
        <IconShell {...rest}>
          <path d="m9 18 6-6-6-6" />
        </IconShell>
      );
    default:
      return null;
  }
}

/** Renders a social brand icon by platform name. */
export function SocialIcon({ platform, ...rest }: { platform: BrandName } & SvgProps) {
  return <BrandIcon name={platform} {...rest} />;
}

/** Generic icon lookup for service/UI glyphs. */
export function Icon({ name, ...rest }: { name: IconName } & SvgProps) {
  if (name === "facebook" || name === "instagram" || name === "tiktok"
    || name === "whatsapp" || name === "youtube" || name === "linkedin") {
    return <BrandIcon name={name} {...rest} />;
  }
  if (name === "architectural" || name === "pillar" || name === "sandstone"
    || name === "building" || name === "civil" || name === "land") {
    return <ServiceIcon name={name} {...rest} />;
  }
  return <UiIcon name={name} {...rest} />;
}