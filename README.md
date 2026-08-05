# AUTHENTIC J.A. CONSTRUCTION LTD.

Enterprise digital ecosystem for **AUTHENTIC J.A. CONSTRUCTION LTD.** — a Ghanaian
construction, engineering, real estate, property development, land allocation,
building-materials, and project-management group.

> **Status: active development.** Phases 1–5 (architecture, design system, database,
> backend API modules, authentication & RBAC) are **complete**; Phase 6 (public
> website — homepage + request/CRM-lead intake) is **in progress**. The monorepo
> typechecks, lints, tests, and builds. See `docs/ROADMAP.md` for the phase tracker
> and what ships next.

## What this is

A real, production-ready platform — **not a mockup**. It includes:

- **Public corporate website** (Next.js)
- **Native mobile app** (React Native + Expo)
- **REST API** (NestJS)
- **PostgreSQL + Prisma** database
- Portals and operations for projects, real estate, land, materials, block factory,
  equipment, inventory, procurement, HR, payroll, employee IDs, finance, CRM,
  documents, notifications, and audit logging.

## Repository structure

```
apps/
  web/        Next.js (App Router, Tailwind) — public site + client/employee/staff/admin portals
  mobile/     React Native + Expo (Expo Router) — role-based native app
packages/
  api-client/ typed HTTP client                        validation/  zod schemas
  auth/       scrypt hashing + JWT                     database/    Prisma schema (Phase 3)
  config/     shared eslint / tsconfig                 ui/          React UI primitives
  types/      shared domain types                      utils/       shared helpers
services/
  api/        NestJS REST API (prefix /api/v1)
infrastructure/
  docker/     local Postgres + Adminer                 deployment/  production deployment (Phase 23)
docs/         ARCHITECTURE · DATABASE · API · SECURITY · DEPLOYMENT · ROADMAP
```

## Quickstart

Prerequisites: **Node ≥ 20** (tested on Node 24) and npm.

```bash
# 1. Install all workspace dependencies (monorepo root)
npm install

# 2. Start the local database (needs Docker)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Environment variables
cp .env.example .env          # fill in DATABASE_URL, secrets, etc.

# 4. Run everything (web on :3000, api on :4000, mobile via Expo)
npm run dev

# Or run a single app
npm run dev --workspace=@ajac/web
npm run dev --workspace=@ajac/api
npm run dev --workspace=@ajac/mobile
```

Check that services are alive:
- Web: `http://localhost:3000/api/health`
- API: `http://localhost:4000/api/v1/health`

## Quality gates (run from the root)

```bash
npm run typecheck   # strict TypeScript across all packages/apps
npm run lint        # ESLint (flat config)
npm test            # Vitest unit + API tests
npm run build       # Next build, Nest build, Expo web export
```

CI runs all four automatically (`.github/workflows/ci.yml`).

## Official brand & corporate assets

The official **logo**, **letterhead**, and **Certificate of Incorporation** supplied by
the company are the source of truth for corporate identity. Until they are committed,
the UI renders a clearly-labelled placeholder mark (`packages/ui`). Place supplied files in:

- `apps/web/public/brand/` (public-facing logo/letterhead usage notes)
- the admin-only **Corporate Document Vault** (incorporation/registration docs — Phase 20+)

The logo is **never** redesigned or replaced with a generic icon. Nothing sensitive is
publicly exposed.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — decisions, stack, structure
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema conventions (schema in Phase 3)
- [`docs/API.md`](docs/API.md) — API conventions and module roadmap
- [`docs/SECURITY.md`](docs/SECURITY.md) — auth, RBAC, secrets, data policy
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — running + deploying
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 23-phase build tracker