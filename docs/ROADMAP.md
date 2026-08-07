# Roadmap

Each phase ends by **running tests, typechecking, linting, building, verifying
migrations/endpoints/frontend/mobile, and fixing errors** before continuing.

| #   | Phase                          | Status       |
| --- | ------------------------------ | ------------ |
| 1   | Repository architecture        | **Complete** |
| 2   | Design system                  | **Complete** |
| 3   | Database (schema + migrations) | **Complete** |
| 4   | Backend (API modules)          | **Complete** |
| 5   | Authentication & RBAC          | **Complete** |
| 6   | Public website                 | **Complete** |
| 7   | Admin portal                   | **Complete** |
| 8   | Quotations & official documents | **Complete** |
| 9   | Employee management & org structure | **Complete** |
| 10  | Staff portal                       | **Complete** |
| 11  | Client portal                      | **Complete** |
| 12  | Projects                           | **Complete** |
| 13  | Real estate                        | **Complete** |
| 14  | Land                               | **Complete** |
| 15  | Materials & block factory          | **Complete** |
| 16  | Equipment                          | Pending      |
| 17  | Finance                            | Pending      |
| 18  | Payroll & payslips                 | Pending      |
| 19  | Employee IDs (QR verification)     | Pending      |
| 20  | Native Expo application            | Pending      |
| 21  | Notifications, documents           | Pending      |
| 22  | Testing (expansion)                | Pending      |
| 23  | Security audit                     | Pending      |
| 24  | Production deployment              | Pending      |

## Phase 1 — done

- npm-workspaces monorepo + Turborepo task runner.
- Root config: strict TypeScript base, ESLint flat, Prettier, `.env.example`, `.gitignore`.
- Packages: `config`, `types`, `utils`, `validation` (zod), `auth` (scrypt + jwt),
  `database` (Prisma placeholder), `api-client`, `ui` — with unit tests for utils,
  validation, and auth.
- Web: Next.js 16 App Router + Tailwind v4 with brand tokens and a `/api/health` route.
- Mobile: Expo SDK 57 + Expo Router with `(auth)(public)(client)(employee)(staff)(admin)`
  role groups and a brand theme.
- API: NestJS 11 with `GET /api/v1/health`, global validation, CORS, and an e2e test.
- Infrastructure: docker-compose (Postgres 16 + Adminer), GitHub Actions CI, deployment
  placeholder.
- Docs: this roadmap plus ARCHITECTURE / DATABASE / API / SECURITY / DEPLOYMENT.

## Phase 2 — done

- Canonical design tokens in `packages/ui/src/tokens.ts` (single source of truth):
  full green/blue/red/neutral scales, semantic colors, type scale, spacing (4px
  grid), radii, shadows, z-index, durations, breakpoints.
- CSS projection `packages/ui/src/tokens.css` (`--ajac-*` custom properties,
  framework-agnostic) wired into the web app and mapped into a Tailwind `@theme`
  adapter in `apps/web/src/app/globals.css`.
- Shared primitives in `packages/ui/src/components`: Button, ButtonLink, Card,
  Badge, Heading/Text/Kicker, Container, Stack, Divider, Spinner, Input/Field,
  BrandMark (placeholder), all token-driven inline-style components.
- Mobile theming (`apps/mobile/src/constants/theme.ts`) now re-exports colors,
  type scale, spacing and radii from `@ajac/ui/tokens` (single source across
  platforms).
- Web landing page rebuilt on the primitives; a `/design` showcase route documents
  the palette, type, buttons, badges, cards, forms and feedback components.
- Token-integrity tests in `packages/ui/src/tokens.test.ts`.

## Phase 3 — done

- Full Prisma schema (~70 models, ~45 enums) in `packages/database/prisma/schema.prisma`
  covering Identity/Company/People/Projects/Real estate/Land/Materials/Procurement/
  Equipment/HR/Finance/CRM/Documents/Notifications/System.
- Conventions enforced: uuid PKs, createdAt/updatedAt, soft delete, FK indexes,
  unique business keys, `Decimal(18,2)` money / `(14,3)` quantities.
- `@ajac/database` package wired: generated client (prisma-client-js →
  `src/generated/client`), `createPrismaClient()` factory + stable dev singleton,
  full re-exports; scripts for generate/validate/migrate/studio/test/typecheck/lint/build.
- Baseline migration authored via `prisma migrate diff` (no local Postgres) and
  applied in CI against a `postgres:16-alpine` service with `prisma migrate deploy`.
- Package tests: client-factory shape, URL/log overrides, singleton stability,
  enum + `Prisma.ModelName` integrity (7/7 passing).

## Phase 4 — done

- `@ajac/database` now builds to CJS `dist/` (runtime-compiled; the one exception to
  source-only workspace packages) so the Node 24 API can `require` it. `scripts/copy-generated.js`
  copies the generated Prisma client next to the tsc output; the copy skips unchanged
  files so a running API process holding the Windows engine DLL (`query_engine-*.dll.node`)
  no longer breaks the build with EPIPE.
- `PrismaService` (extends `PrismaClient`, lazy DATABASE_URL, `$disconnect` on destroy)
  wired as a global module — the API boots without a database.
- Common infrastructure: `PaginationQueryDto` + `Paginated<T>` + `paginate()`/`prismaSkipTake()`/
  allow-listed `buildOrderBy()` (guards column injection), a single global
  `AllExceptionsFilter` producing `{ statusCode, error, message, timestamp, path }`
  (maps Prisma P2002/P2003 → 409, P2025 → 404, hides internals on 500), and
  `generateBusinessCode()` for `CLI-YYYYMMDD-XXXXXX` style codes.
- Feature modules (all DB-backed, soft-delete, paginated, no fake endpoints):
  - `company` — profile only (GET / POST / PATCH); org structure deferred.
  - `clients` — list/get/create/update/soft-delete, status/type filters, search,
    auto `clientCode`.
  - `leads` — same pattern, source/stage filters, auto `leadNo`.
  - `projects` — same pattern, type/status filters, auto `code`.
  - `system` — `system/settings` and `system/feature-flags` key-value CRUD (hard delete).
- 18 API tests pass (e2e app boot + envelope/404/validation; unit: pagination, filter
  mapping, ClientsService), full repo gate green: typecheck 13/13, lint 10/10,
  test 9/9, build 10/10.

## Phase 5 — done

- **Token transport**: HS256 access token (`Authorization: Bearer`) shared by web
  portals and mobile; opaque refresh token stored only as a sha256 hash in the
  `Session` table. Refresh **rotates** (old session revoked, new pair issued);
  reusing a revoked token revokes **all** of the user's sessions (theft signal).
  Logout revokes the session; password changes revoke every session.
- **Two global guards** (`APP_GUARD`): `AuthGuard` (valid bearer required unless
  `@Public()`) + `PermissionsGuard` (`@RequirePermissions('module.action')`).
  Roles/permissions are reloaded from the DB **per request**, so deactivation and
  permission changes apply immediately. `SUPER_ADMIN` gets all permissions by
  seeding — no hard-coded guard bypass.
- **Auth module**: `POST /auth/login` (generic 401, never reveals email existence;
  scrypt verify; 5-failures/15-min in-memory throttle per email+IP), `POST
  /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`.
  Sensitive actions write `AuditLog` rows (actor/IP/user-agent).
- **Users module**: paginated list/search + role/isActive filters, create (hashed
  password, role assignment in a transaction), update (admin password reset
  revokes sessions; role replacement), soft delete (revokes sessions), self-delete
  blocked. Safe select never returns `passwordHash`.
- **Roles module**: full catalog (permissions flattened, user counts), create/update
  validate permission codes, delete rejected while any user holds the role.
- **Seed**: `npm run seed --workspace=@ajac/api` idempotently upserts the 16-code
  permission catalog, the six canonical roles (`@ajac/types` `ROLE_NAMES`), and the
  bootstrap admin from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (dev fallback prints
  a one-time generated password).
- **Phase 4 controllers protected**: `clients`, `leads`, `projects`, `company`,
  `system/settings`, `system/feature-flags` now require their `*.read`/`*.write`
  permissions (401 without a token, 403 without the permission); `health`, login,
  and refresh are `@Public()`.
- **Runtime fix**: `@ajac/auth` and `@ajac/types` now build to CJS `dist/` like
  `@ajac/database` (sources-first entries broke `node dist/main.js` and the seed
  script at runtime), so the built API boots standalone.
- **Tests**: 54 API tests pass (auth service: login/throttle/refresh rotation/reuse
  detection/logout/change-password; users + roles services; both guards; e2e boot
  covers health 200, protected 401, login validation 400, unknown 404). Full gate
  green: typecheck 14/14, lint 10/10, test 10/10, build 10/10, live boot verified
  on :4100.
- **Docs**: `SECURITY.md` Phase 5 (bearer, rotation + reuse detection, env vars),
  `API.md` auth/users/roles endpoints with required permissions.

## Phase 6 — completed (Public website)

- **Company config source of truth** (`apps/web/src/config/company.ts`): single
  editable profile — name, motto, registration **Reg. No. CS212101021**, **TIN
  C0061318752**, phones, email (`authenticjaconstruction.gh@gmail.com`), offices
  (Head Office Kumasi; Registered Business Address Accra), office hours, the six
  request types, and social-media entries with configurable `url` (a `null` URL
  renders the icon disabled instead of linking nowhere). Falls back to the
  DB-backed Company-Settings record when that module lands.
- **Public request system**: every marketing CTA (`Request a Quote`, `Start a
  Project`, `Book a Site Inspection`, `Request Property/Land Information`,
  `Contact Sales`) routes to `/request?type=…`, a client form with full client +
  server-side validation, file-upload (name only), and a success state showing the
  CRM reference. The web route handler `/api/requests` forwards to the API;
  **`POST /api/v1/requests`** (`@Public()`) validates and creates a `Lead`
  (`source: WEBSITE`, `status: NEW`, auto `leadNo`, request fields stored as JSON
  on `Lead.notes`) → returns `{ ok, reference }`. Emits a 503 (service down) or
  502 (API error) with a phone fallback instead of failing silently.
- **Homepage redesign** (`apps/web/src/app/page.tsx`): 15-section corporate-group
  flow — utility bar, expanded header nav, blue hero holding the official
  signboard, quick-action row, company overview, four business divisions, six core
  services as icon cards, real-estate + land, materials & block factory, plant &
  heavy-equipment, why-choose-us, request-a-quote CTA, contact, and a multi-column
  footer (brand + social, Company, Services, Projects, Quick Links, contact) with a
  legal bottom bar showing the Reg No / TIN. Real social icons open official
  profiles in a new tab; disabled when unconfigured. Full contrast/typography pass —
  charcoal/white/grey UI base with the logo colors as accents, no unreadable
  same-on-same text.
- **No mock functionality**: fabricated stats, testimonials, and news are omitted
  until genuine; careers/news/client-portal pages are deferred rather than faked.
- **Appointment booking**: a `consultation` request type ("Book an Appointment" —
  consultation / site inspection / meeting scheduling) added to the public form
  and API allowlist, surfaced in the hero, contact section, and support widget.
- **Contacts**: international `+233` display with purpose labels (Sales / Customer
  Service / General Support) from a single config; contact section consolidated to
  a concise Call / WhatsApp / Email panel with an imagery band, and office hours
  moved to the footer — no repeated numbers across sections.
- **Premium support widget** (`SupportWidget`): fixed bottom-right launcher, fade-in,
  never auto-opens, no bounce. Shows only on customer-facing pages (home, request,
  services/properties/contact/appointment routes as they ship). Branded header
  ("…LTD. — Customer Support"), quick options + free text, collects name/email/phone,
  posts to `/api/requests` to create a CRM lead, replies with business-hours-aware
  handover copy and a phone fallback on 503/502. Accessible (dialog, ESC, labelled).
- **Typography & contrast**: whole site uses the Geist sans (display inherits sans —
  one modern family); every dark/light pairing audited for WCAG contrast.
- **Imagery scaffold**: `COMPANY_IMAGES` config + `PhotoBlock` component + a
  `public/company/README.md` manifest naming the real photographs to supply (hero,
  construction, materials, equipment); sections render a clean branded panel until
  a photo is configured — never a broken image or a fabricated one.
- **Official logo**: header, footer and CompanySignboard render the real
  `/brand/aja-logo.png` (config-driven via `COMPANY_LOGO`, with a graceful
  fallback chain), replacing the "AJ.A" placeholder text in the public site.
- **Tests**: `requests` unit + e2e (validation-only) added; repo gate green:
  typecheck, lint, test (57 API tests), build.

## Phase 7 — done (Admin portal)

Admin portal lives inside `apps/web` at `/admin/*`, reusing `@ajac/ui` + tokens;
server-side API proxying (never from the browser bundle) with httpOnly cookies.

- **Server-to-server proxy** (`apps/web/src/lib/admin/auth.ts` + `resources.ts`):
  cookie read/write, `apiFetch(path, init)` attaches the cookie bearer and does a
  transparent **401 → refresh → retry** via `POST /auth/refresh`; a shared `toNext`
  passthrough preserves API status + JSON body, and emits an empty response for
  204/205 so DELETE works.
- **Auth route handlers** (`/api/admin/auth/{login,logout,refresh}`): login calls
  `POST /api/v1/auth/login` → stores `ajac_at` + `ajac_rt` httpOnly cookies →
  returns the user; logout revokes the session and clears cookies; refresh rotates
  the pair.
- **Resource route handlers** (`/api/admin/{leads,clients,projects}` + `[id]`):
  GET lists pass through `page/pageSize/sortBy/sortOrder` + per-resource filters
  (`source/status/search`, `type/status/search`, `projectType/status/search`),
  leaving DTO whitelisting to the API. `GET/PATCH/DELETE /:id` use dynamic segments.
- **Auth guard + shell** (`admin/(app)/layout.tsx` redirects to `/admin/login` when
  no access cookie; `AdminShell` sidebar — Dashboard/Leads/Clients/Projects, brand
  topbar, Sign out, "View public site"). Login page is a standalone route outside
  the guarded group.
- **Boards**: Dashboard (server-rendered counts + recent leads) and Leads/Clients/
  Projects lists with filters + pagination + inline create form; detail pages show
  fields with a **status select** (PATCH) and delete. Reusable `AdminTable`,
  `Pagination`, `StatusBadge`, `EntityForm` components built from `@ajac/ui`.
- **Widget gating**: `SupportWidget` already only renders on public paths (`show`
  checks customer routes), so it stays off `/admin/*` with no code change.

## Phase 8 — done (Quotations & official documents)

- **Quotations API module** (`services/api/src/quotations/`): full CRUD mirroring
  `clients` — controller/service/module, `create`/`update`/`query`/`quotation-item`
  DTOs, `@RequirePermissions('quotations.read' / 'quotations.write')`, soft delete,
  pagination with `status` / `clientId` / `projectId` / `search` filters. The
  service computes authoritative totals server-side with `Prisma.Decimal`
  (Σ qty×unit → subtotal, tax at `taxRate`, discount, total), stores items in a
  transaction, auto-numbers `QT-YYYYMMDD-XXXXXX`, sets `issuedAt`, and includes
  nested `client` / `project` / `lead` / `items`. Status-only updates keep the
  stored figures and line items intact. Seed catalog grew to **18 permissions**
  (`quotations.read` / `quotations.write`); SUPER_ADMIN inherits them (re-login to
  pick them up). 8 new unit tests for the service (totals math, filters, item
  replacement, status-only preservation, soft delete).
- **PDF generation** (`apps/web`): `@react-pdf/renderer` 4.5.1 with
  `serverExternalPackages` in `next.config.ts`; the Node-runtime route handler
  `GET /api/admin/quotations/:id/pdf` authenticates via the admin cookie, fetches
  the record (relations included), renders the React-PDF template, and streams
  `application/pdf` with `Content-Disposition: attachment`. PDFs regenerate on
  demand from the DB — no file storage.
- **Swappable letterhead** (`apps/web/src/config/documents.ts`): single source of
  truth for every generated document — name, Reg No **CS212101021**, TIN
  **C0061318752**, head office **Plot 13, Block K, Kenyase–Brofoyedru**, phones,
  email, the three banks (UMB / Fidelity / Sekyedomase Rural Bank; account numbers
  left as placeholders), VAT default 15%, 30-day validity, default terms.
  `letterheadImage: null` composes a clean text header (logo + contact band); set
  it to a `public/` path to switch the header to the real letterhead artwork.
  Verified live: editing a config value changes every regenerated PDF immediately.
- **Admin Documents UI**: "Documents" nav item → `/admin/documents` board (search,
  status filter, pagination, per-row PDF download), `/admin/documents/new`
  (client/project selects, title, validity, VAT rate, discount, line-item editor
  with live totals), `/admin/documents/[id]` (items table, computed totals, status
  select → PATCH, Download PDF, inline Edit, Delete). Reuses `useList`,
  `AdminTable`, `Pagination`, `StatusBadge`, `Button`.
- **Currency in PDFs**: cedi symbol `₵` has no mapping in the base-14 PDF fonts, so
  document amounts render as **GHS** (e.g. "GHS 250,000.00") instead of garbage.
- **Web gates green**: typecheck, lint, build (Turbopack bundles
  `@react-pdf/renderer` cleanly). Live end-to-end verified: login → create client +
  project → create quotation (2 line items, 15% VAT) → correct totals
  (268,750.00 / 40,312.50 / 309,062.50) → PDF shows the full letterhead, itemized
  table, totals, bank details, signature blocks, page numbering → status
  DRAFT→SENT persisted with totals intact → list filter + search → signed-out
  requests to `/api/admin/quotations*` return 401.

## Phase 9 — done (Employee management & org structure)

- **Employees API module** (`services/api/src/employees/`): full CRUD mirroring
  `clients` — controller/service/module, `create`/`update`/`query` DTOs,
  `@RequirePermissions('employees.read' / 'employees.write')`, auto `EMP-YYYYMMDD-XXXXXX`
  code, `Date` conversion on `hireDate`/`dateOfBirth`/`terminationDate`, Decimal
  `salary`, nested `department` / `position` / `branch` relations, pagination with
  `status` / `employmentType` / `departmentId` / `positionId` / `branchId` / `search`
  filters (case-insensitive code/name/email search), soft delete via `deletedAt`.
  Seed catalog grew to **20 permissions**; SUPER_ADMIN inherits them (re-login to
  pick them up). 7 new unit tests (auto code + dates, filters, NotFound, partial
  update, null termination clear, soft delete).
- **Org structure API module** (`services/api/src/org/`): `/company-branches`,
  `/departments`, `/positions` CRUD scoped to the seeded company record
  (`Authentic J.A. Construction Limited`, created by the seed), auto codes
  (`BR-`/`DPT-`/`POS-YYYYMMDD-XXXXXX`), `_count.employees` on lists, soft delete.
  One permission pair (`org.read` / `org.write`) covers all three. Seed catalog
  grew to **22 permissions** and now seeds the Company. 5 new unit tests.
- **Admin Org UI**: "Org structure" nav item → `/admin/org` with three inline
  panels (Branches, Departments, Positions) — create form, inline rename,
  employee-count chip, delete. `/admin/employees` forms now populate their
  department/position/branch selects from these endpoints.
- **Admin Employees UI**: "Employees" nav item → `/admin/employees` board (search,
  status filter, pagination, columns Emp. No / Name / Department / Position /
  Status / Salary), `/admin/employees/new` (department/position/branch selects
  populate once Org structure exists), `/admin/employees/[id]` (full detail,
  status select → PATCH, inline Edit, Delete). Reuses `useList`, `AdminTable`,
  `Pagination`, `StatusBadge`, `Button`.
- **Gates green**: API typecheck / lint / build / 72 tests; web typecheck / lint /
  build (route types regenerated via `next typegen`). Live end-to-end verified:
  create employee → `EMP-…` auto code + `hireDate` + Decimal salary → list /
  search → PATCH status (salary preserved) → DELETE 204 + GET 404 + list empty →
  signed-out 401.

## Phase 10 — done (Staff portal)

A role-gated, self-scoped `/staff` area for company staff, plus `/admin` authorization
hardening. (Table numbering is authoritative; some later narrative sections use drifted
phase numbers.)

- **Staff API module** (`services/api/src/staff/`): controller/service/module, registered
  in `app.module.ts`. `GET /staff/profile` loads the caller's linked `Employee`
  (department/position/branch relations) and returns `{ user, employee }` (200 even when no
  employee is linked — the UI shows a prompt instead of an error). `GET /staff/notifications`
  returns the caller's own latest 20 notifications plus a `totalUnread` count. Both are
  authenticated-only — no permission decorator — because they only ever return the caller's
  **own** data.
- **Demo STAFF seed**: idempotent block creates a `CompanyBranch` ("Kumasi HQ"),
  `Department` ("Construction Operations"), `Position` ("Site Foreman") only if absent, then
  an `Employee` (`EMP-DEMO-0001`) linked to a `STAFF`-role `User`
  (`SEED_STAFF_EMAIL`/`SEED_STAFF_PASSWORD`, generated + printed when unset) plus a welcome
  notification.
- **Portal roles**: `apps/web/src/lib/auth/roles.ts` exposes `ADMIN_ROLES`
  (`SUPER_ADMIN`/`ADMIN`/`MANAGEMENT`) and `STAFF_ROLES` (`STAFF`/`EMPLOYEE`) with
  `isAdmin`/`isStaff`; `lib/auth/token.ts` base64-decodes the JWT `roles` claim so the
  Next.js guards bucket the signed-in user cheaply (the API remains the enforcement point).
- **`/admin` hardening**: `admin/(app)/layout.tsx` now redirects non-admin roles — staff to
  `/staff`, everyone else to `/admin/login` — even when they hold a valid token (previously
  any signed-in user reached the shell).
- **`/staff` portal** (`apps/web/src/app/staff/`): shared `LoginForm` (posts to the existing
  login handler, then routes by role → `/admin` or `/staff`), guarded `(app)/layout.tsx`,
  `StaffShell` (reuses `AdminShell` with dashboard/profile nav), server-rendered Dashboard
  (profile summary + notifications), and a client **My profile** page (full record +
  change-password via `/api/staff/password` → `/auth/change-password`). Route handlers
  `api/staff/{profile,notifications,password}` reuse `apiFetch` + `toNext`.
- **Gates green**: 4 new `staff.service` unit tests; API typecheck / lint / build / tests,
  web typecheck / lint / build (route types regenerated via `next typegen`).

## Phase 11 — done (Client portal)

A role-gated, self-scoped `/client` area where a company's clients see their own profile and
quotations. Mirrors the staff-portal architecture exactly (`Client.userId` is the unique link
to `User`), with ownership enforced on the API.

- **Client API module** (`services/api/src/client/`): controller/service/module, registered
  in `app.module.ts`. `GET /client/profile` loads the caller's linked `Client` and returns
  `{ user, client }` (200 even when no client is linked). `GET /client/quotations` returns the
  caller's own latest 20 **client-facing** quotations (DRAFT excluded) with `meta.total`.
  `GET /client/quotations/:id` returns one owned quotation with nested `client`/`project`/`items`
  and **404s** on anything not the caller's — this is the ownership check the PDF download
  rides on. All authenticated-only (no permission decorator) because they only ever return the
  caller's own data.
- **Demo CLIENT seed**: idempotent block creates a `Client` record (`CLI-DEMO-0001`, Kwame
  Mensah) linked to a `CLIENT`-role `User` (`SEED_CLIENT_EMAIL`/`SEED_CLIENT_PASSWORD`,
  generated + printed when unset), plus one demo `SENT` quotation with two line items so the
  portal has a downloadable document, and a welcome notification.
- **Portal roles**: `roles.ts` now exposes `CLIENT_ROLES` + `isClient()`; the shared
  `LoginForm` routes CLIENT-role users to `/client`. The `/client` guard turns away admins
  (→ `/admin`), staff (→ `/staff`), and unknown tokens (→ `/client/login`).
- **`/client` portal** (`apps/web/src/app/client/`): login page, guarded `(app)/layout.tsx`,
  `ClientShell` (reuses `AdminShell` with Dashboard/My profile nav), server-rendered Dashboard
  (profile card + quotations list with status/validity/total), and a client **My profile** page
  (full record + change-password via `/api/client/password` → `/auth/change-password`). Route
  handlers `api/client/{profile,quotations,password}` reuse `apiFetch` + `toNext`.
- **Client PDF download**: `api/client/quotation/[id]/pdf` fetches via the **self-scoped**
  `/client/quotations/:id` (not the admin `/quotations/:id`), so a client can never download a
  document that isn't theirs; then renders the standard quotation letterhead PDF.
- **Gates green**: 8 new `client.service` unit tests; API typecheck / lint / build / tests,
  web typecheck / lint / build (route types regenerated via `next typegen`).

## Phase 10 — done (Real estate & Properties + ownership certificates) [narrative numbering drifted — see the table]

- **Properties API module** (`services/api/src/properties/`): three controllers
  sharing `properties.read` / `properties.write` —
  `/property-types` (auto `PTY-` code, hard delete — no `deletedAt` on the model),
  `/properties` (auto `PROP-` code, `status`/`typeId`/`search` filters, nested
  `propertyType`/`project`, soft delete), and `/property-sales` (auto `SALE-` code,
  `balanceAmount` computed as `price − deposit` when not supplied, a COMPLETED sale
  marks the property `SOLD` via `syncPropertyStatus`, closedAt set on completion,
  hard delete — `PropertySale` also has no `deletedAt`). Seed catalog grew to
  **24 permissions**. 7 new unit tests (auto codes, list filters, balance compute,
  property-status sync, NotFound, soft/hard delete).
- **Ownership certificate PDF** (`apps/web`): `PropertyCertificateTemplate` reuses
  the letterhead (`Letterhead` + `DOC_COLORS`), lists the property, owner, price,
  deposit, balance and signatures; `renderPropertyCertificatePdf` mirrors
  `renderQuotationPdf`; served from `/api/admin/property-sales/[id]/certificate`
  (nodejs runtime). Download link appears on COMPLETED sales.
- **Admin UI**: "Properties" → `/admin/properties` board (search, status filter,
  columns Code / Property / Type / Status / Price), new + detail (status select →
  PATCH, inline Edit, Delete); "Property sales" → `/admin/property-sales` board +
  new + detail (certificate download); "Property types" → `/admin/property-types`
  reusing `OrgPanel`. Web proxy routes `/api/admin/property-types`,
  `/api/admin/properties`, `/api/admin/property-sales` (+ `[id]`, certificate).
- **Gates green**: API typecheck / lint / build / 84 tests; web typecheck / lint /
  build (`next typegen` after the new routes). Live end-to-end verified: create
  type → `PTY-` code → property → `PROP-` code → sale with deposit → `SALE-` code +
  balance = price − deposit (property stays AVAILABLE) → COMPLETED sale → property
  becomes SOLD + closedAt set → search by client → PATCH deposit recomputes balance →
  hard delete sale → 404 → signed-out 401; certificate PDF decoded and checked for
  owner / property / codes / money.

## Phase 14 — done (Land)

- **Land API module** (`services/api/src/land/`): four controllers sharing
  `land.read` / `land.write` —
  `/land-projects` (auto `LND-` code, search by name/code/location, per-project
  `_count` of plots + allocations, soft delete),
  `/land-plots` (`landProjectId` / `status` filters, search by plot number/address,
  nested `landProject` + `allocation`, soft delete),
  `/land-allocations` (auto `ALC-` code, `landProjectId` / `clientId` / `status`
  filters, `allocatedAt`/`signedAt` Date conversion, an ACTIVE/COMPLETED allocation
  marks its plot `SOLD` via `syncPlotStatus`, hard delete — `LandAllocation` has no
  `deletedAt`), and
  `/land-documents` (project-scoped file records, list/get/create/delete, hard
  delete). Seed catalog grew to **26 permissions** (`land.read` / `land.write`);
  SUPER_ADMIN inherits them (re-login to pick them up). 6 new unit tests in
  `land.service.spec` (auto codes, filters, plot-status sync, NotFound, soft/hard
  delete).
- **No new migration**: `LandProject`, `LandPlot`, `LandAllocation`, `LandDocument`
  (and `LandPayment`) all landed in the Phase 3 baseline migration, so the module is
  fully DB-backed as-is.
- **Admin UI**: "Land" → `/admin/land-projects`, `/admin/land-plots`,
  `/admin/land-allocations` boards (search, status filter, pagination, create as new +
  detail with status select → PATCH, Edit, Delete) reusing `AdminTable`,
  `Pagination`, `StatusBadge`; `LandAllocationForm` scopes its plot select to the
  selected project (when a project is removed the plot list is cleared from the
  selection's `onChange`, never synchronously in the effect). Web proxy routes
  `/api/admin/land-projects`, `/land-plots`, `/land-allocations`, `/land-documents`
  (+ `[id]`).
- **Gates green**: API typecheck / lint / build / **90 tests** (up from 84);
  web typecheck / lint / build clean. One `react-hooks/set-state-in-effect` lint
  error in `LandAllocationForm` was fixed by moving the plot-list reset into the
  project select's `onChange` instead of the effect body.

## Phase 15 — done (Materials & block factory)

Materials procurement, multi-warehouse stock (with a ledger + audit trail) and a
block-products factory (production batches + sales) — all DB-backed via the Phase 3
baseline migration, so **no new migration** was required.

- **Materials API module** (`services/api/src/materials/`, permission-gated
  `materials.read` / `materials.write`):
  - `/material-categories` — CRUD (search, auto `MATCAT-` code, `_count` of materials).
  - `/materials` — CRUD (search, `categoryId` / `isActive` filters, `currentStock`,
    `costPerUnit`, `reorderLevel`, nested `category`, soft delete).
  - `/warehouses` — CRUD (search, `managerId`, `_count` of inventory rows).
  - `/inventory` — GET (replaces the flat reading: `warehouseId` / `categoryId`
    filters, nested `material` + `material.category` + `warehouse`), plus stock-op
    POSTs: `/receipts`, `/issuances`, `/adjustments` (physical count), `/transfers`
    (between warehouses). Each op writes an `InventoryTransaction` + `StockMovement`
    and adjusts the `material.currentStock`.
  - `/inventory-transactions` (GET, `type` / `materialId` / `warehouseId` filters) and
    `/stock-movements` (GET, warehouse filter) — the immutable ledger + audit trail.
- **Blocks API module** (`services/api/src/blocks/`, `blocks.read` / `blocks.write`):
  - `/block-products` — CRUD (`unitPrice` Decimal, spec JSON, `isActive`).
  - `/block-productions` — CRUD (batch `QUALITY`/`QUANTITY` record, `status`).
  - `/block-sales` — CRUD (auto sale reference, `clientId` optional → walk-in sale,
    `totalAmount` computed from quantity × unitPrice, `PAYMENT_STATUSES`, nested
    `product` + `client`).
- **Seed**: grew to **30 permissions** (`materials.read`/`write` + `blocks.read`/`write`);
  idempotent demo data — 4 categories, 3 materials (with 200 bags cement opening stock),
  2 warehouses, 2 block products, 1 production batch `PRD-DEMO-0001`, 1 sale `SALE-DEMO-0001`.
- **Admin UI** under `/admin/materials`, `/admin/material-categories` (OrgPanel),
  `/admin/warehouses`, `/admin/inventory` (board + **Receive/Issue/Adjust/Transfer** via a
  `StockOpModal`), `/admin/inventory-transactions`, `/admin/stock-movements`,
  `/admin/block-products`, `/admin/block-productions`, `/admin/block-sales` — all reusing
  `AdminTable`, `Pagination`, `StatusBadge`, proxy routes `/api/admin/*` (+ `[id]`).
- **Gates green**: API typecheck / lint / build / **135 tests / 20 files** (up from 90);
  web typecheck / lint / build clean. One `react-hooks/set-state-in-effect` lint error in
  `StockOpModal` was fixed by remounting the modal on a changing `key` — which also
  re-initializes its form state from the current op's defaults, removing the reset effect
  entirely. The generated `[id]` proxy routes had single-quoted `"/resource/${id}"`
  literals (would 404); they were corrected to template literals `` `/resource/${id}` ``.

## Phase 12 — done (Projects)

Real construction workflows on top of the existing Project model — phases (milestones),
work logs (site updates), per-role staff dashboards, and a richer admin detail view. No
Prisma migration required: `Project`, `ProjectMilestone`, `ProjectUpdate`, `ProjectMember`
and `Notification` all existed since the Phase 3 baseline.

- **Enriched `GET /projects/:id`** (`projects.service.get`): nested `manager` (Employee
  name), `client`, `members` (with employee name), `milestones` (dueDate/createdAt order),
  and the latest 100 `updates` (newest first) with `authorName` resolved from the author's
  `User` (`ProjectUpdate.authorId` has no FK, so names are joined in the service).
- **Project sub-resources** (`projects.controller.ts`, permission-gated `projects.read` /
  `projects.write`):
  - `/projects/:id/milestones` — GET list, POST create (`create-project-milestone.dto`),
    PATCH + DELETE `:milestoneId`, POST `:milestoneId/complete` (sets
    `status=COMPLETED` + `completedAt`, idempotent, notifies the project manager).
  - `/projects/:id/updates` — GET list, POST work log (`create-project-update.dto`);
    `authorId` is resolved server-side from the caller, `publishedAt` optional.
  - `/projects/:id/members` — GET list, POST add (`add-project-member.dto`, deduped via
    the unique `[projectId, employeeId]` → 409 Conflict), DELETE `:memberId`.
- **Staff self-scoped controller** (`staff-projects.controller.ts`, authenticated-only, no
  `@RequirePermissions` — mirrors the `/client` pattern):
  - `GET /staff/projects` — visible projects with summaries: managers (the caller manages
    any project), admins, and `projects.read` holders see all; everyone else sees projects
    they manage or are a `ProjectMember` of. Rows carry `updateCount`, `milestoneCount`,
    `completedMilestones` and the `latestUpdate` (top-200 dedup).
  - `GET /staff/projects/:id` — detail with milestones + updates + members, 404 unless
    managed/assigned/admin; returns `{ project, capabilities: { canManage, canLogWork } }`.
  - `POST /staff/projects/:id/updates` — **member-gated** work log (`canLogWork`), notifies
    the manager.
  - `POST /staff/projects/:id/milestones/:milestoneId/complete` — manager/admin only
    (`canManage`), notifies the manager.
  - All access decisions flow through one `resolveAccess` helper (admin short-circuit →
    `managerId` → `ProjectMember`), so staff/web both enforce the same rules.
- **Seed**: idempotent demo project **PRJ-DEMO-0001** "AUTHENTIC J.A. demo site" (manager =
  demo staff `EMP-DEMO-0001`, budget GHS 1,200,000, Kenyase–Brofoyedru), 4 phases (Site
  clearing completed, Foundation/Structure/Finishing pending), 2 work-log updates, a
  `ProjectMember` (SITE_SUPERVISOR), and milestone/update notifications — the staff
  dashboard has content on first boot.
- **Staff portal** (`/staff/projects`): server-rendered board of summary cards (status
  badge, budget, "n/m phases done" progress bar, work-log count, latest update snippet)
  linking to a client detail page with overview + **Phases** (mark-done button for
  managers) + **Work log** (textarea for members, timeline with author + timestamp).
  Read-only viewers see phases + budget only.
- **Admin portal** (`/admin/projects/:id`): rebuilt from a flat card into four sections —
  existing overview card + **Phases** (create/edit/mark-done/delete via `EntityForm`),
  **Work log** (read-only timeline), **Team** (add/remove `ProjectMember`s via an employee
  select). Web proxy routes added under `/api/admin/projects/[id]/{milestones,updates,members}`
  and `/api/staff/projects`.
- **Gates green**: 15 new `projects.service` unit tests (membership gate allow/deny,
  manager + admin bypass, milestone completion transition + idempotency, notifications,
  author-name join, list/detail scoping, member add/remove) → API suite at **117 tests /
  18 files**; API + web typecheck / lint / build clean (`next typegen` after the new
  routes). The API vitest config pins `NODE_ENV: 'test'` so the suite is immune to a
  shell that exports `NODE_ENV=production` (which would otherwise trip the JWT-secret
  guard in `auth-config`).