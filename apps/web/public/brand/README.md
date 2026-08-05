# Official brand & corporate assets — place supplied files here.

This directory is reserved for the **official assets supplied by the company**:

- The official **AJ.A logo** (email/ask the company for the highest-resolution vector
  and any monochrome / white variants).
- The official **company letterhead** (used as the basis for corporate documents
  and PDF payslip/quote/invoice layouts).
- The **Certificate of Incorporation** and other registration documents — these
  belong in the **Corporate Document Vault** (admin-restricted), NOT in the public
  `public/` tree.

## Asset inventory (current)

- `brand/ajac-logo.jpg` — the **official logo**, supplied by the company and now
  rendered by the `CompanySignboard` component on the homepage
  (`apps/web/src/components/CompanySignboard.tsx`).

## Placeholder policy

Until the official assets are added, the UI renders a neutral `BrandMark`
placeholder (see `packages/ui`). The official logo is **never** replaced or
redesigned; the placeholder is swapped out for the supplied asset.

Still to source: an official letterhead (`brand/ajac-letterhead.pdf`) as the basis
for corporate document layouts (quotes, invoices, payslips). The Certificate of
Incorporation and other registration papers belong in the **Corporate Document
Vault** (admin-restricted), NOT in the public `public/` tree.