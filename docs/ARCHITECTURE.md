# Architecture

AUTHENTIC J.A. CONSTRUCTION LTD. — enterprise digital ecosystem.

## Decisions (approved)

| Concern       | Choice                                                                  |
| ------------- | ----------------------------------------------------------------------- |
| Repo          | Single npm-workspaces monorepo run by **Turborepo**                     |
| Package mgr   | npm workspaces (`apps/*`, `packages/*`, `services/*`)                   |
| Language      | TypeScript, strict, across the entire stack                              |
| Web           | Next.js (App Router), Tailwind CSS v4, SSR/SEO                          |
| Mobile        | React Native + Expo (Expo Router), role-based navigation                 |
| API           | NestJS 11 (REST, `/api/v1`), global ValidationPipe, CORS                |
| Database      | PostgreSQL 16 + Prisma ORM (schema in Phase 3)                           |
| Auth          | scrypt password hashing (no native deps); JWT (jose) + refresh rotation |
| Storage       | Object storage with signed URLs (provider-agnostic)                     |
| Tests         | Vitest (unit + API e2e via supertest), GitHub Actions CI                |

## How shared packages are consumed

Workspace packages are **source-only TypeScript** (`exports` point at `src/index.ts`).
Bundlers compile them:

- **Web** imports them via Next.js `transpilePackages`.
- **Expo/Metro** transpiles workspace sources by default; `metro.config.js` is a
  passthrough enabling monorepo auto-detection.
- **API** currently imports `@ajac/types` via `import type` (erased at compile, so no
  runtime coupling). When shared runtime packages (auth, database) are wired into the
  API in Phase 4, the API will consume their compiled output or a dedicated build.

This keeps edits hot-reloadable and avoids a dist-build/watch loop in development.

## Repository layout

```
apps/
  web/        public site + protected portal route-groups (public never mixed with private)
  mobile/     (auth)(public)(client)(employee)(staff)(admin) Expo Router groups
packages/
  api-client/ validation/  auth/   database/  config/   ui/   types/   utils/
services/
  api/        NestJS modules under src/<module>/, prefix /api/v1
infrastructure/
  docker/     docker-compose for local Postgres + Adminer
  deployment/ production deploy definitions (Phase 23)
```

## Environments

- `development` — local, Docker Postgres, `.env`
- `staging` — Phase 23
- `production` — Phase 23 (Web host, Node API host, managed Postgres, object storage,
  Cloudflare DNS/edge, HTTPS everywhere)

## Domain plan (to confirm separately, not assumed)

`www.…com` · `app.…com` · `admin.…com` · `api.…com` · `verify.…com`

## Data & identity policy

- Real data only. No fabricated projects, portfolio, certifications, employees,
  properties, or financial figures. Missing info => admin-configurable CMS fields.
- Official logo/letterhead/incorporation docs are the corporate source of truth and
  are never altered. The logo is never redesigned.
- Sensitive registration/banking/payroll data is admin-restricted and never public.