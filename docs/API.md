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

## Endpoints (Phase 8 — Quotations)

### Quotations

`/quotations` — same REST shape as `clients`; auto `quotationNo`
(`QT-YYYYMMDD-XXXXXX`); the server computes subtotal / tax (at `taxRate`) /
discount / total with `Prisma.Decimal`; line items are stored as related rows;
responses include nested `client`, `project`, `lead`, `items`. A status-only
PATCH keeps the stored figures and items.

| Method | Path               | Permission        | Notes |
| ------ | ------------------ | ----------------- | ----- |
| GET    | `/quotations`      | `quotations.read` | Paginated; `status`, `clientId`, `projectId`, `search` filters |
| GET    | `/quotations/:id`  | `quotations.read` | Single quotation with relations |
| POST   | `/quotations`      | `quotations.write` | `{ title, clientId?, leadId?, projectId?, validUntil?, taxRate?, discount?, currency?, status?, items: [{ description, quantity, unitPrice }] }` → 201 |
| PATCH  | `/quotations/:id`  | `quotations.write` | Partial update; `items` replaces all items and recomputes totals |
| DELETE | `/quotations/:id`  | `quotations.write` | Soft delete → 204 |

**PDF** — the web app serves the generated document (admin session required) at
`GET /api/admin/quotations/:id/pdf`, rendering the record on the company letterhead
via `@react-pdf/renderer` and streaming `application/pdf`. The letterhead lives in
`apps/web/src/config/documents.ts` — swap a value there (or drop in the real
letterhead image) and every regenerated PDF updates.

## Endpoints (Phase 9 — Employees)

`/employees` — same REST shape as `clients`; auto `employeeCode`
(`EMP-YYYYMMDD-XXXXXX`); `hireDate` / `dateOfBirth` / `terminationDate` are
converted to `Date`; `salary` is a Decimal (string in JSON). Responses include
nested `department`, `position`, `branch` (all nullable until Org structure
populates them).

| Method | Path               | Permission        | Notes |
| ------ | ------------------ | ----------------- | ----- |
| GET    | `/employees`       | `employees.read`  | Paginated; `status`, `employmentType`, `departmentId`, `positionId`, `branchId`, `search` filters |
| GET    | `/employees/:id`   | `employees.read`  | Single employee with relations |
| POST   | `/employees`       | `employees.write` | `{ firstName, lastName, otherNames?, email?, phone?, nationalId?, gender?, dateOfBirth?, address?, departmentId?, positionId?, branchId?, employmentType?, hireDate, terminationDate?, status?, salary? }` → 201 |
| PATCH  | `/employees/:id`   | `employees.write` | Partial update; `terminationDate: null` clears it |
| DELETE | `/employees/:id`   | `employees.write` | Soft delete → 204 |

## Endpoints (Phase 9 — Org structure)

`/company-branches`, `/departments`, `/positions` — small CRUD resources scoped to
the seeded company; auto codes (`BR-` / `DPT-` / `POS-YYYYMMDD-XXXXXX`); list
responses include `_count.employees`; soft delete. All share the same permission
pair and query shape.

| Method | Path                        | Permission   | Notes |
| ------ | --------------------------- | ------------ | ----- |
| GET    | `/company-branches`         | `org.read`   | Paginated; `search` filter |
| GET    | `/company-branches/:id`     | `org.read`   | Single branch |
| POST   | `/company-branches`         | `org.write`  | `{ name, code?, location?, phone?, email?, isHeadquarter? }` → 201 |
| PATCH  | `/company-branches/:id`     | `org.write`  | Partial update |
| DELETE | `/company-branches/:id`     | `org.write`  | Soft delete → 204 |
| GET    | `/departments`              | `org.read`   | Paginated; `search` filter |
| GET    | `/departments/:id`          | `org.read`   | Single department |
| POST   | `/departments`              | `org.write`  | `{ name, code?, headId? }` → 201 |
| PATCH  | `/departments/:id`          | `org.write`  | Partial update; `headId: null` clears it |
| DELETE | `/departments/:id`          | `org.write`  | Soft delete → 204 |
| GET    | `/positions`                | `org.read`   | Paginated; `search` filter |
| GET    | `/positions/:id`            | `org.read`   | Single position |
| POST   | `/positions`                | `org.write`  | `{ title, code?, level? }` → 201 |
| PATCH  | `/positions/:id`            | `org.write`  | Partial update; `level: null` clears it |
| DELETE | `/positions/:id`            | `org.write`  | Soft delete → 204 |

## Endpoints (Phase 10 — Properties)

`/property-types`, `/properties`, `/property-sales` — real estate resources sharing
`properties.read` / `properties.write`. Auto codes (`PTY-` / `PROP-` / `SALE-`).
`balanceAmount` is computed as `price − deposit` on create/update when not supplied;
a COMPLETED sale sets `closedAt` and marks the property `SOLD`. `PropertyType` and
`PropertySale` have no `deletedAt`, so their DELETE is a hard delete (204);
`Property` soft-deletes.

| Method | Path                       | Permission        | Notes |
| ------ | -------------------------- | ----------------- | ----- |
| GET    | `/property-types`          | `properties.read`  | Paginated; `search` filter; `_count.properties` |
| GET    | `/property-types/:id`      | `properties.read`  | Single type |
| POST   | `/property-types`          | `properties.write` | `{ name, code?, description? }` → 201 |
| PATCH  | `/property-types/:id`      | `properties.write` | Partial update; `description: null` clears it |
| DELETE | `/property-types/:id`      | `properties.write` | Hard delete → 204 |
| GET    | `/properties`              | `properties.read`  | Paginated; `status`, `typeId`, `search` filters; nested `propertyType`, `project` |
| GET    | `/properties/:id`          | `properties.read`  | Single property with relations |
| POST   | `/properties`              | `properties.write` | `{ name, code?, typeId?, projectId?, status?, description?, address?, location?, price?, areaSqm?, bedrooms?, bathrooms?, floorPlanUrl?, featured? }` → 201 |
| PATCH  | `/properties/:id`          | `properties.write` | Partial update; `null` clears nullable fields |
| DELETE | `/properties/:id`          | `properties.write` | Soft delete → 204 |
| GET    | `/property-sales`          | `properties.read`  | Paginated; `status`, `propertyId`, `search` filters; nested `property`, `client` |
| GET    | `/property-sales/:id`      | `properties.read`  | Single sale with relations |
| POST   | `/property-sales`          | `properties.write` | `{ propertyId, clientId, price, depositAmount?, balanceAmount?, status?, saleDate }` → 201 |
| PATCH  | `/property-sales/:id`      | `properties.write` | Partial update; `status: COMPLETED` sets `closedAt` + property SOLD |
| DELETE | `/property-sales/:id`      | `properties.write` | Hard delete → 204 |

The ownership certificate is a web-side document (not an API route): GET
`/api/admin/property-sales/:id/certificate` renders the A4 PDF on the letterhead.

## Endpoints (Phase 10 — Staff)

These are **self-scoped**: the API only ever returns the caller's own data, so they are
authenticated-only (no permission required) and work for any active user — staff, employees,
or admins viewing their own record.

| Method | Path                  | Permission   | Notes |
| ------ | --------------------- | ------------ | ----- |
| GET    | `/staff/profile`      | authenticated | The caller as `{ user, employee }`; `employee` includes `department`, `position`, `branch`, or is `null` when no Employee is linked |
| GET    | `/staff/notifications`| authenticated | Caller’s own latest 20 notifications, newest first, plus `meta.total` / `meta.totalUnread` |

Consumed by the web `/staff` portal via `api/staff/{profile,notifications}` proxies.

## Endpoints (Phase 11 — Client portal)

Like the staff portal, these are **self-scoped**: they only ever return the caller's own
data, so they are authenticated-only (no permission required). The client-facing endpoints
never expose a quotation the caller's linked Client doesn't own.

| Method | Path                | Permission   | Notes |
| ------ | ------------------- | ------------ | ----- |
| GET    | `/client/profile`    | authenticated | The caller as `{ user, client }`; `client` is the linked `Client` relation, or `null` when none is linked |
| GET    | `/client/quotations` | authenticated | The caller's own latest 20 client-facing quotations (excludes DRAFT), newest first, with `meta.total` |
| GET    | `/client/quotations/:id` | authenticated | A single quotation owned by the caller's client, with nested `client`/`project`/`items`; **404** if it is not theirs (or deleted / still DRAFT) |

The web `/client` portal consumes these via `api/client/{profile,quotations}` proxies, and
the per-quotation PDF is served from `api/client/quotation/[id]/pdf` — ownership is enforced
by the API's self-scoped GET, so a client can never download another client's document.

## Module roadmap

| Route prefix        | Ships in |
| ------------------- | -------- |
| `auth`, `users`, `roles` | **Phase 5 — done** |
| `company`, `clients`, `leads`, `projects` (core CRUD) | **Phase 4 — done** |
| `system` (settings, feature-flags) | **Phase 4 — done** |
| `requests` (public lead intake)    | **Phase 6 — done** |
| `quotations` (saved documents + PDF letterhead) | **Phase 8 — done** |
| `employees`, `hr`   | **Phase 9 — done** |
| `org` (company-branches, departments, positions) | **Phase 9 — done** |
| `properties` (property-types, properties, property-sales + ownership certificate) | **Phase 10 — done** |
| `staff` (self-scoped profile + notifications, powers the `/staff` portal) | **Phase 10 — done** |
| `client` (self-scoped profile + quotations, powers the `/client` portal) | **Phase 11 — done** |
| `projects` (lifecycle: planning, budgets, milestones) | Phase 12 |
| `land`              | Phase 13 |
| `materials`, `inventory`, `equipment` | Phase 14–15 |
| `finance`, `invoices`, `payments`      | Phase 16 |
| `payroll`           | Phase 17 |
| `documents`, `notifications` | Phase 20 |

**No fake endpoints.** Real business, DB-backed, permission-checked modules are added
phase by phase; placeholder-only routes are not exposed as if complete.
