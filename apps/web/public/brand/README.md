# Brand assets

Drop official company brand assets here. The primary logo is the only file the
public site renders — replace it to change the logo site-wide with no code change.

## Current assets

| Asset | File | Status |
|-------|------|--------|
| Official logo | `aja-logo.png` | In use — renders in the header, footer and CompanySignboard |

## How the logo drop-in works

`Logo.tsx` reads `COMPANY_LOGO.src` from `apps/web/src/config/company.ts` and
expects the file at the exact path listed above (`/brand/aja-logo.png`).

**To change the logo**: overwrite `public/brand/aja-logo.png` with the new file
(same extension). The site picks it up on the next build — no code edit required.

**Legacy names**: the component also tries `/brand/ajac-logo.jpg` as a fallback
if the primary file is missing. To add more fallbacks, add paths to
`COMPANY_LOGO.candidates` in `company.ts`.

## Recommended logo specifications

- **Format**: transparent-background PNG or SVG (preferred) for clean rendering
  at any size and on any background.
- **If using a photograph** (e.g. signboard photo): the component applies a soft
  radial mask to fade the edges, blending the photo into the page background.
  For best results, use a high-contrast image with the logo content centered.
- **Resolution**: at least 512×512 for sharp rendering at all display sizes.

## Still to source

- Official **company letterhead** (`brand/ajac-letterhead.pdf`) for corporate
  document layouts (quotes, invoices, payslips).
- Clean **transparent-background logo** PNG or SVG for optimal rendering at all
  sizes — the current signboard photo works but a transparent version would
  elevate the entire site's presentation.
- The **Certificate of Incorporation** and registration documents belong in the
  **Corporate Document Vault** (admin-restricted), NOT in the public `public/` tree.
