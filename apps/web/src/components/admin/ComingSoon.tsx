import Link from "next/link";
import { NavIcon, type NavIconName } from "./nav-icons";

/**
 * Placeholder page for a department that doesn't have working modules yet.
 *
 * The master refactor adds professional departments progressively. Until a
 * department's modules land, its sidebar section routes here so the admin sees
 * a clear "coming soon" rather than a dead link or a missing page. The icon
 * reuses the same glyph as its sidebar section.
 */
export function ComingSoon({
  sectionLabel,
  icon,
  description,
}: {
  /** Name of the department/section, e.g. "Engineering & Technical". */
  sectionLabel: string;
  /** Section icon (same as the sidebar's glyph for this department). */
  icon: NavIconName;
  /** One-line description of what this department will cover. */
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{sectionLabel}</h1>
        <p className="text-sm text-neutral-500">
          This department is part of the enterprise roll-out. Its modules are being built.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
        <span className="text-brand-blue">
          <NavIcon name={icon} className="h-12 w-12" />
        </span>
        <h2 className="text-lg font-semibold text-neutral-900">{sectionLabel}</h2>
        <p className="max-w-md text-sm text-neutral-600">{description}</p>
        <Link
          href="/admin"
          className="mt-2 rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to Command Center
        </Link>
      </div>
    </div>
  );
}