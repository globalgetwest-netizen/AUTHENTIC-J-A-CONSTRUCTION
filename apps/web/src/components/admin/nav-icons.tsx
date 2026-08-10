import type { SVGProps } from "react";

/**
 * Small hand-rolled stroke icons for the grouped sidebar sections.
 *
 * No icon library ships in this repo (`apps/web` deps are @ajac/*, react,
 * next, @react-pdf/renderer, qrcode). These glyphs are drawn in the same
 * convention as the existing `src/components/icons.tsx` set: 24×24 viewBox,
 * `fill="none"`, `stroke="currentColor"`, 2px round caps/joins — so they match
 * visually and inherit text colour from the shell.
 *
 * @see src/components/icons.tsx
 */

/** The fixed set of section icons the sidebar may render. */
export type NavIconName =
  | "command-center"
  | "governance"
  | "commercial"
  | "projects"
  | "engineering"
  | "quantity-surveying"
  | "procurement"
  | "stores"
  | "manufacturing"
  | "plant"
  | "fleet"
  | "property"
  | "finance"
  | "hr"
  | "hse"
  | "documents"
  | "reporting";

type NavIconProps = Omit<SVGProps<SVGSVGElement>, "name">;

/** Shared <svg> shell — mirrors `IconShell` in `src/components/icons.tsx`. */
function IconShell({ children, ...props }: { children: React.ReactNode } & NavIconProps) {
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

/**
 * Renders one section glyph by name. Unknown names fall back to a neutral
 * rounded-square "module" mark rather than returning nothing.
 */
export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  switch (name) {
    case "command-center":
      // Layout dashboard
      return (
        <IconShell className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </IconShell>
      );
    case "governance":
      // Org hierarchy (three boxes, two connectors)
      return (
        <IconShell className={className}>
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <path d="M12 8v4M5 16v-3h14v3" />
        </IconShell>
      );
    case "commercial":
      // Briefcase
      return (
        <IconShell className={className}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
          <path d="M3 12h18" />
        </IconShell>
      );
    case "projects":
      // Building / construction
      return (
        <IconShell className={className}>
          <path d="M3 21h18" />
          <path d="M5 21V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v13" />
          <path d="M9 9h.01M14 9h.01M9 13h.01M14 13h.01" />
          <path d="M12 21v-4" />
        </IconShell>
      );
    case "engineering":
      // Cog
      return (
        <IconShell className={className}>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
        </IconShell>
      );
    case "quantity-surveying":
      // Ruler
      return (
        <IconShell className={className}>
          <rect x="3" y="11" width="18" height="4" rx="1" />
          <path d="M7 11v2.2M11 11v1.6M15 11v2.2M19 11v1.6" />
        </IconShell>
      );
    case "procurement":
      // Truck (supply chain)
      return (
        <IconShell className={className}>
          <path d="M14 18V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
          <path d="M15 18h-3" />
          <path d="M18 18h3a1 1 0 0 0 1-1v-4.6a1 1 0 0 0-.4-.8l-2.2-1.9-2.5-3.1a1 1 0 0 0-.8-.4H14" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </IconShell>
      );
    case "stores":
      // Warehouse / archive
      return (
        <IconShell className={className}>
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
          <path d="M10 12h4" />
        </IconShell>
      );
    case "manufacturing":
      // Block
      return (
        <IconShell className={className}>
          <rect x="4" y="8" width="16" height="8" rx="1.5" />
          <path d="M4 15h16M16 5l-1.5 3M8.5 16l-1.5 3M12 8v3.5" />
        </IconShell>
      );
    case "plant":
      // Wrench (equipment)
      return (
        <IconShell className={className}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
        </IconShell>
      );
    case "fleet":
      // Car
      return (
        <IconShell className={className}>
          <rect x="3" y="14" width="18" height="5" rx="2" />
          <path d="M5 14l1.5-4a1 1 0 0 1 1-.6h9a1 1 0 0 1 1 .6L19 14" />
          <circle cx="7.5" cy="17" r="0.9" />
          <circle cx="16.5" cy="17" r="0.9" />
        </IconShell>
      );
    case "property":
      // House
      return (
        <IconShell className={className}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M10 21v-6h4v6" />
        </IconShell>
      );
    case "finance":
      // Banknote
      return (
        <IconShell className={className}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </IconShell>
      );
    case "hr":
      // Users
      return (
        <IconShell className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </IconShell>
      );
    case "hse":
      // Shield with check — safety
      return (
        <IconShell className={className}>
          <path d="M12 3l7 3v5c0 5-3.2 8.1-7 9.5C8.2 19.1 5 16 5 11V6z" />
          <path d="M9 12l2 2 4-4" />
        </IconShell>
      );
    case "documents":
      // File with text
      return (
        <IconShell className={className}>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v4h4" />
          <path d="M8 13h8M8 17h8M8 9h3" />
        </IconShell>
      );
    case "reporting":
      // Bar chart
      return (
        <IconShell className={className}>
          <path d="M3 3v18h18" />
          <rect x="7" y="12" width="3" height="6" rx="0.5" />
          <rect x="12" y="8" width="3" height="10" rx="0.5" />
          <rect x="17" y="5" width="3" height="13" rx="0.5" />
        </IconShell>
      );
    default:
      // Neutral module mark fallback
      return (
        <IconShell className={className}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 12h8" />
        </IconShell>
      );
  }
}