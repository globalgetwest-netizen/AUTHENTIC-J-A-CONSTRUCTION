# Brand assets

Approved corporate-branding assets live here. These are the **only** brand
files the site and the document/ID generators use. Do not reintroduce retired
legacy files (`aja-logo.png`, `ajac-logo.jpg`, `aja-letterhead-full.jpg`,
`aja-letterhead-header.jpg`, `ceo-stamp-signature.png`, etc.) — they were
removed as part of the corporate-branding unification.

## Current assets

| Asset | File | Used by |
|-------|------|---------|
| Official logo (clean, transparent) | `aja-icon.svg` | Public site header/footer/signboard; all generated PDFs |
| App / favicon icon | `aja-icon.svg` | App shell, favicon |
| Main company letterhead | `aja-main-company-letterhead.png` | Company documents, certificates, letters, ID cards |
| CEO & Founder letterhead | `aja-ceo-founder-letterhead.png` | CEO & Founder letters, CEO documents |
| CEO signature | `ceo-signature.png` | Certificates, letters, ID cards |
| CEO stamp / seal | `ceo-stamp.png` | Certificates, letters, ID cards |

## Source of truth

- **Public site logo** — `COMPANY_LOGO.src` in `apps/web/src/config/company.ts`
  points at `/brand/aja-icon.svg`. Change it there to update the whole site.
- **Generated-document branding** — `LETTERHEAD` in `apps/web/src/config/documents.ts`
  is the single source of truth for every generated PDF (logos, letterheads,
  signatures, stamp, company name, Reg. No., TIN, addresses).

The letterhead image files are already the approved final versions — do not
add any image or overlay onto them; they are final.
