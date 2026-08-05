# API

Versioned REST API built on **NestJS 11**, served under the global prefix `api/v1`.

## Conventions

- **Base path**: `/api/v1`
- **Health**: `GET /api/v1/health` → `{ status, service, version, timestamp }`
  (`services/api/src/health`).
- **Validation**: every request DTO is validated by a global `ValidationPipe`
  (`whitelist: true, transform: true`) — unknown properties are stripped, invalid
  bodies get `400` with a `message` array.
- **Errors**: consistent shape `{ statusCode, error, message, timestamp, path }`
  via a single global `AllExceptionsFilter`. Prisma errors are mapped
  (P2002/P2003 → 409, P2025 → 404); unknown errors return a generic 500 message —
  internals are never leaked.
- **Pagination**: `page` / `pageSize` (and optional `sortBy` / `sortOrder`) query
  params; list responses use `Paginated<T>` = `{ data, meta: { total, page, pageSize,
  totalPages } }`. `sortBy` values are allow-listed per module — column injection is
  blocked.
- **Soft delete**: `DELETE` sets `deletedAt`; lists/gets exclude soft-deleted rows.
  (`system/settings` and `system/feature-flags` are hard-deleted key-value stores.)
- **Auth/RBAC**: enforced on the backend, never only the frontend. Every route
  except `@Public()` ones (`health`, `auth/login`, `auth/refresh`, `requests`) requires
  `Authorization: Bearer <accessToken>` → 401 without a valid token. `@RequirePermissions`
  decorators then enforce module permissions → 403 without them. Permissions are
  re-read from the DB on every request. Access tokens are HS256 JWTs
  (`JWT_ACCESS_TTL`, default 900s); refresh tokens are rotated opaque secrets
  stored as sha256 hashes in `Session`.

## Running

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d   # Postgres
npm run dev --workspace=@ajac/api                                  # http://localhost:4000/api/v1
```

The API boots without a database (the Prisma client defers env resolution to the
first query); DB-backed routes then return the 500 envelope until Postgres is up.

Bootstrap the admin + permission catalog (idempotent):

```bash
npm run build
npm run seed --workspace=@ajac/api   # upserts permissions, roles, admin
```

## Endpoints (Phase 5)

### Auth

| Method | Path                 | Permission | Notes                                       |
| ------ | -------------------- | ---------- | ------------------------------------------- |
| POST   | `/auth/login`        | public     | `{ email, password }` → `{ accessToken, refreshToken, expiresIn, user }` |
| POST   | `/auth/refresh`      | public     | `{ refreshToken }` → new token pair (rotation) |
| POST   | `/auth/logout`       | bearer     | `{ refreshToken }` → revoke session, 204    |
| GET    | `/auth/me`           | bearer     | Current user + roles + permissions          |
| POST   | `/auth/change-password` | bearer  | `{ currentPassword, newPassword }` → 204; revokes all sessions |

### Users

| Method | Path            | Permission    | Notes                              |
| ------ | --------------- | ------------- | ---------------------------------- |
| GET    | `/users`        | `users.read`  | Paginated; `search`, `roleId`, `isActive` filters |
| GET    | `/users/:id`    | `users.read`  |                                    |
| POST   | `/users`        | `users.write` | `{ email, password, firstName, lastName, roleIds? }` |
| PATCH  | `/users/:id`    | `users.write` | profile, `roleIds`, admin `password` reset (revokes sessions) |
| DELETE | `/users/:id`    | `users.write` | soft delete + revoke sessions → 204 |

### Roles

| Method | Path          | Permission   | Notes                                   |
| ------ | ------------- | ------------ | --------------------------------------- |
| GET    | `/roles`      | `roles.read` | Full catalog with permissions + user counts |
| GET    | `/roles/:id`  | `roles.read` |                                         |
| POST   | `/roles`      | `roles.write`| `{ name, description?, permissionCodes? }` |
| PATCH  | `/roles/:id`  | `roles.write`| rename / set permissions                |
| DELETE | `/roles/:id`  | `roles.write`| rejected while any user holds the role → 204 |

## Endpoints (Phase 4)

### Company

| Method | Path               | Notes                             |
| ------ | ------------------ | --------------------------------- |
| GET    | `/company`         | Profile (404 until set up)        |
| POST   | `/company`         | Create profile (first write wins) |
| PATCH  | `/company`         | Update profile                    |

### Clients

| Method | Path               | Notes                                        |
| ------ | ------------------ | -------------------------------------------- |
| GET    | `/clients`         | Paginated; `type`, `status`, `search` filters|
| GET    | `/clients/:id`     | Single client (uuid)                         |
| POST   | `/clients`         | Auto `clientCode` if omitted                 |
| PATCH  | `/clients/:id`     | Partial update                               |
| DELETE | `/clients/:id`     | Soft delete → 204                            |

### Leads

`/leads` — same REST shape; `source`, `stage`, `search` filters; auto `leadNo`.

### Projects

`/projects` — same REST shape; `type`, `status`, `search` filters; auto `code`.

### System

| Method | Path                        | Notes                |
| ------ | --------------------------- | -------------------- |
| GET    | `/system/settings`          | Paginated key-values |
| GET    | `/system/settings/:key`     |                      |
| POST   | `/system/settings`          |                      |
| PATCH  | `/system/settings/:key`     |                      |
| DELETE | `/system/settings/:key`     | Hard delete → 204    |
|        | `/system/feature-flags`     | Same as settings     |

## Endpoints (Phase 6 — Public website)

### Requests

Public form submissions from the marketing site. `@Public()` — no token required —
so the public portal can create a CRM lead without credentials. The request fields
are stored as structured JSON on `Lead.notes`; a `Lead` is created with
`source: WEBSITE`, `status: NEW`, and an auto `leadNo`.

| Method | Path        | Notes                                                                 |
| ------ | ----------- | --------------------------------------------------------------------- |
| POST   | `/requests` | `requestType` + `fullName` + `email` + `phone` required → 201 with `{ ok, reference }` |

Validation via `SubmitRequestDto`: `requestType` must be one of
`quote | project | site-inspection | property | land | sales`; `preferredContactMethod`
one of `phone | email | whatsapp`; optional fields `company`, `whatsapp`, `projectType`,
`service`, `budgetRange`, `preferredLocation`, `description` (≤4000), `attachmentName` (≤255).

## Module roadmap

| Route prefix        | Ships in |
| ------------------- | -------- |
| `auth`, `users`, `roles` | **Phase 5 — done** |
| `company`, `clients`, `leads`, `projects` (core CRUD) | **Phase 4 — done** |
| `system` (settings, feature-flags) | **Phase 4 — done** |
| `requests` (public lead intake)    | **Phase 6 — in progress** |
| `employees`, `hr`   | Phase 10 |
| `projects` (lifecycle: planning, budgets, milestones) | Phase 11 |
| `properties`        | Phase 12 |
| `land`              | Phase 13 |
| `materials`, `inventory`, `equipment` | Phase 14–15 |
| `finance`, `invoices`, `payments`      | Phase 16 |
| `payroll`           | Phase 17 |
| `documents`, `notifications` | Phase 20 |

**No fake endpoints.** Real business, DB-backed, permission-checked modules are added
phase by phase; placeholder-only routes are not exposed as if complete.
