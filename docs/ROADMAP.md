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
| 6   | Public website                 | **In progress** |
| 7   | Admin portal                   | Pending      |
| 8   | Staff portal                   | Pending      |
| 9   | Client portal                  | Pending      |
| 10  | Employee management            | Pending      |
| 11  | Projects                       | Pending      |
| 12  | Real estate                    | Pending      |
| 13  | Land                           | Pending      |
| 14  | Materials & block factory      | Pending      |
| 15  | Equipment                      | Pending      |
| 16  | Finance                        | Pending      |
| 17  | Payroll & payslips             | Pending      |
| 18  | Employee IDs (QR verification) | Pending      |
| 19  | Native Expo application        | Pending      |
| 20  | Notifications, documents       | Pending      |
| 21  | Testing (expansion)            | Pending      |
| 22  | Security audit                 | Pending      |
| 23  | Production deployment          | Pending      |

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

## Phase 6 — in progress (Public website)

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
- **Official logo**: header and footer render the real `/brand/ajac-logo.jpg`
  (with a graceful fallback), replacing the "AJ.A" placeholder text in the public site.
- **Tests**: `requests` unit + e2e (validation-only) added; repo gate green:
  typecheck, lint, test (57 API tests), build.

Next: **Phase 7 — Admin portal** (staff login, Clients/Leads/Projects boards).