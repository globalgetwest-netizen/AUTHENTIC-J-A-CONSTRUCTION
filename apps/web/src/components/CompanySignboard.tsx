'use client';

import { Logo } from './Logo';

/**
 * Faithful reproduction of the company's physical signboard: logo + gold
 * "AUTHENTIC J.A" / navy "CONSTRUCTION LIMITED" header, blue accent line,
 * and the real service lines. Contacts live in the site footer.
 *
 * The official logo asset lives at `public/brand/aja-logo.png`
 * (see `apps/web/public/brand/README.md`). Config-driven via `COMPANY_LOGO`
 * in `apps/web/src/config/company.ts` — drop a new logo to replace it.
 */

const SERVICES = [
  'Architectural Designs',
  'Pillar Construction',
  'Sand & Stone',
  'Building Construction',
  'Civil Engineering',
  'Acquisition of Land',
];

export function CompanySignboard() {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/10">
      {/* Header — logo + company title */}
      <div className="flex items-center gap-4 bg-blue-900 px-5 py-4">
        <Logo width={64} />
        <div className="min-w-0">
          <div className="text-xl font-extrabold leading-tight tracking-wide text-brand-gold sm:text-2xl">
            AUTHENTIC J.A
          </div>
          <div className="text-sm font-bold tracking-[0.18em] text-white sm:text-base">
            CONSTRUCTION LIMITED
          </div>
        </div>
      </div>

      {/* Blue accent line — matches the logo underline, full width */}
      <div className="h-[2px] w-full bg-blue-600" />

      {/* Body — services */}
      <div className="px-5 py-5">
        <h3 className="inline-block bg-red-500 px-2 py-0.5 text-xs font-extrabold tracking-widest text-white">
          SERVICES
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-neutral-800 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom red trim */}
      <div className="bg-red-500 px-5 py-2 text-center text-xs font-bold tracking-widest text-white">
        CONSTRUCTION · HIRE · MATERIALS · LAND
      </div>
    </div>
  );
}
