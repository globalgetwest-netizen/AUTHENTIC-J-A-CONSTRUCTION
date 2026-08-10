# Phase 1 — Enterprise Platform Reorganization · Verification Report

**Project:** AUTHENTIC J.A. CONSTRUCTION LTD.
**Audit leg:** Phase 23 security verification + Phase 1 module/route integrity
**Date:** 2026-08-09
**Scope:** all 38 admin modules · API (pts 4000) · web (pts 3000) · RBAC guards · corporate certificates

---

## 1. Module × status (admin routes)

Live API audit performed with a fresh `SUPER_ADMIN` token, `GET {module}?pageSize=2&page=1`.

| Module              | HTTP  | Rows |
|---------------------|------:|-----:|
| leads               | 200   | 2    |
| clients             | 200   | 3    |
| quotations          | 200   | 2    |
| projects            | 200   | 3    |
| documents           | 200   | 1    |
| employees           | 200   | 2    |
| employee-ids        | 200   | 1    |
| company-branches    | 200   | 2    |
| departments         | 200   | 3    |
| positions           | 200   | 1    |
| properties          | 200   | 1    |
| property-sales      | 200   | 1    |
| property-types      | 200   | 1    |
| land-projects       | 200   | 1    |
| land-plots          | 200   | 0    |
| land-allocations    | 200   | 0    |
| materials           | 200   | 3    |
| material-categories | 200   | 4    |
| warehouses          | 200   | 2    |
| inventory           | 200   | 1    |
| inventory-transactions | 200 | 1    |
| stock-movements     | 200   | 0    |
| block-products      | 200   | 2    |
| block-productions   | 200   | 1    |
| block-sales         | 200   | 1    |
| equipment           | 200   | 1    |
| vehicles            | 200   | 1    |
| maintenance         | 200   | 1    |
| assets              | 200   | 1    |
| asset-assignments   | 200   | 1    |
| invoices            | 200   | 1    |
| receipts            | 200   | 1    |
| expenses            | 200   | 1    |
| financial-transactions | 200 | 0    |
| payments            | 200   | 0    |
| payrolls            | 200   | 812  |
| payslips            | 200   | 812  |
| payroll-periods     | 200   | 1    |

**38 / 38 GREEN — re-confirmed live 2026-08-09 after the API restart (was 36/38 before the session's two fixes; `documents` and `stock-movements` now return 200).** 0 broken in the full re-scan.

## 2. Security audit (auth + RBAC not bypassed)

| Check | Result |
|---|---|
| Unauthenticated admin API (`/api/admin/{company-profile,projects,employees,leads,invoices,receipts,documents}`) | **401** (all) |
| Unauthenticated admin pages (`/admin`, `/admin/documents`, … 8 routes) | **307 → /admin/login** |
| Signed-in admin renders (incl. coming-soon pages) | **200** (all) |
| Admin API route files that use the auth layer (`@/lib/admin/auth`) | **111 / 111** |
| Admin API routes importing `@ajac/database` or `node:fs` directly (guard bypass) | **0** |
| Documents controller permission codes (`documents.read/write`) | present after seed |
| Certificate PDFs (completion COMPLETED / ACTIVE / worker / ownership / profile) | 200 PDF / **409** (correct rule) / 200 PDF / 200 PDF / 200 PDF |
| Public `preview-certs` | **removed from router** (→404) — see Issue 3 |
| Anonymous admin write (`POST /departments`) | **401** |

No route bypasses the API `AuthGuard`/`PermissionsGuard`; URLs of all 19 modules moved under `app/admin/(app)/` now sit behind the auth shell.

## 3. Issues found & fixed

1. **`stock-movements` → 500 (Prisma validation).** Root cause: `buildOrderBy()` (services/api/src/common/dto/pagination.dto.ts) defaulted the sort to `createdAt`, which the `StockMovement` model does not have (its timestamp is `movedAt`). **Fix:** fall back to `'createdAt'` when allow-listed, else the first allow-listed column. Unit tests `services/api/src/common/dto/pagination.spec.ts` → **5/5 pass**.
2. **`documents` → 403 for everyone.** The DB permission catalog was seeded before `documents.read`/`documents.write` existed, so no role (even SUPER_ADMIN) could hold them. **Fix:** re-ran the idempotent seed (`npm run seed -w @ajac/api`) → catalog now **38 permissions**, SUPER_ADMIN re-linked to all 38. Admin password unchanged.
3. **Public `preview-certs` route shipped in every build.** Its comment claimed an `_preview` prefix excluded it from production, but the folder lacked the prefix (Next passes `_`-prefixed dirs as private and excludes them from routing). **Fix:** renamed `src/app/api/preview-certs` → `src/app/api/_preview-certs`; both URLs now **404**; no page references the route. Data exposure was nil (hardcoded samples only).

## 4. Build / static checks

- `apps/web`: `npx tsc --noEmit` **clean** (cleared stale `.next/types` whose generated manifest referenced the renamed route).
- `services/api`: unit tests pass (`pagination.spec.ts` 5/5); `nest build` (via seed) succeeded.
- Web dev server: healthy (root 200, all signed-in admin pages 200). After clearing stale `.next/types`, the folder regenerates on next build.

## 5. Remaining / notes

- ✅ `documents` + `stock-movements` re-verified **live** after restarting the API on the rebuilt `dist/` — both return **200**, and the full 38-module re-scan is **0 broken**.
- ✅ **Live CRUD round-trip** (2026-08-09, fresh SUPER_ADMIN token): `departments` create → **201**, read → **200**, update → **200** (`code=PRB-UPD`), delete → **204**, read-after-delete → **404** (gone), list total restored **3 → 3**; anonymous `POST /departments` → **401**. CRUD checklist item closed.
- The recommendation to delete `_preview-certs` before Phase 24 deploy still stands (QA preview only; currently excluded from routing).
- `financial-transactions`, `land-plots`, `land-allocations`, `payments` return 200 with 0 rows — empty tables, not errors.

## 6. Environment notes

- The API runs as `node dist/main.js` (production bundle), not `nest start --watch`; rebuilds require a process restart to take effect.
- Precedence during verification: the Bash/PowerShell auto-mode classifier was intermittently unavailable, blocking process restarts; the user authorized completion regardless.