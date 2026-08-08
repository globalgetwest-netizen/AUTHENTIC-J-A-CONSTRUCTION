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
`GET /projects/:id` is enriched with nested `manager`, `client`, `members` (with employee
name), `milestones`, and the latest 100 `updates` (each with a resolved `authorName`).

**Sub-resources** (added Phase 12 — milestones, work log, team):

| Method | Path                                             | Permission   | Notes |
| ------ | ------------------------------------------------ | ------------ | ----- |
| GET    | `/projects/:projectId/milestones`                | `projects.read` | Ordered by dueDate, then createdAt |
| POST   | `/projects/:projectId/milestones`                | `projects.write` | `{ title, description?, dueDate?, status? }` → 201 |
| PATCH  | `/projects/:projectId/milestones/:milestoneId`   | `projects.write` | Partial update; setting `status=COMPLETED` sets `completedAt` |
| DELETE | `/projects/:projectId/milestones/:milestoneId`   | `projects.write` | Hard delete → 204 |
| POST   | `/projects/:projectId/milestones/:milestoneId/complete` | `projects.write` | Marks done (sets `status=COMPLETED` + `completedAt`); idempotent; notifies the project manager |
| GET    | `/projects/:projectId/updates`                   | `projects.read` | Work log, newest first, with `authorName` |
| POST   | `/projects/:projectId/updates`                   | `projects.write` | `{ content, publishedAt? }` → 201; `authorId` resolved server-side; notifies the manager |
| GET    | `/projects/:projectId/members`                   | `projects.read` | Project team, with employee name |
| POST   | `/projects/:projectId/members`                   | `projects.write` | `{ employeeId, role }` → 201; duplicate employee → 409 |
| DELETE | `/projects/:projectId/members/:memberId`         | `projects.write` | Removes from team → 204 |

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

### Staff projects (Phase 12)

Self-scoped like the rest of the staff module, but scoping is **project-based** rather than
"own record": the caller must be a `ProjectMember`, the project `manager`, or an
admin/`projects.read` holder. Access decisions all flow through one helper
(`projects.service.resolveAccess`), so the staff and admin surfaces enforce the same rules.

| Method | Path                                          | Permission   | Notes |
| ------ | --------------------------------------------- | ------------ | ----- |
| GET    | `/staff/projects`                             | authenticated | Visible projects with summaries: `updateCount`, `milestoneCount`, `completedMilestones`, `latestUpdate`; managers/admins/`projects.read` see all, others see managed ∪ assigned |
| GET    | `/staff/projects/:id`                         | authenticated | Detail with milestones + updates + members → `{ project, capabilities: { canManage, canLogWork } }`; **404** unless managed/assigned/admin |
| POST   | `/staff/projects/:id/updates`                 | authenticated | **Member-gated** work log: `{ content, publishedAt? }`; 403 unless the caller can log work; notifies the manager |
| POST   | `/staff/projects/:id/milestones/:milestoneId/complete` | authenticated | Manager/admin only; marks the phase done; notifies the manager |

Consumed by the web `/staff` portal via `api/staff/projects*` proxies.

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

## Endpoints (Phase 15 — Materials & block factory)

Permission-gated modules under `materials.read`/`materials.write` and
`blocks.read`/`blocks.write` (the block factory reuses the `materials.read`/`write`
permissions in code — the `blocks.*` permission strings are not seeded). Inventory ops (receive/issue/adjust/transfer) each write an
`InventoryTransaction` + `StockMovement` row and adjust `material.currentStock`.

### Materials

| Method | Path                         | Permission | Notes |
| ------ | ---------------------------- | ---------- | ----- |
| GET/POST | `/material-categories`     | materials.read/write | list (search, `page`/`pageSize`/`sortBy`/`sortOrder`), create (auto `MATCAT-` code) |
| GET/PATCH/DELETE | `/material-categories/:id` | materials.read/write | get / update / soft delete |
| GET/POST | `/materials`                | materials.read/write | list (search, `categoryId`, `isActive`), create (`categoryId`, `unit`, `costPerUnit`, `reorderLevel`, `currentStock`) |
| GET/PATCH/DELETE | `/materials/:id`        | materials.read/write | nested `category`; update / soft-delete |
| GET/POST | `/warehouses`               | materials.read/write | list, create (`managerId` optional) |
| GET/PATCH/DELETE | `/warehouses/:id`       | materials.read/write | nested `_count.inventory` |
| GET    | `/inventory`                  | materials.read | stock on hand; `warehouseId`/`categoryId` filters; nested `material` + `material.category` + `warehouse` |
| POST   | `/inventory/receipts`         | materials.write | add stock to a warehouse (`materialId`, `warehouseId`, `quantity`, optional `unitCost`) |
| POST   | `/inventory/issuances`        | materials.write | remove stock from a warehouse |
| POST   | `/inventory/adjustments`      | materials.write | set counted stock to `quantity` (physical count, up or down) |
| POST   | `/inventory/transfers`        | materials.write | move `quantity` between `fromWarehouseId` → `toWarehouseId` |
| GET    | `/inventory-transactions`     | materials.read | immutable ledger; `type`/`materialId`/`warehouseId` filters |
| GET    | `/stock-movements`            | materials.read | audit trail; `materialId`/`warehouseId` filters |

### Blocks

| Method | Path                     | Permission | Notes |
| ------ | ------------------------ | ---------- | ----- |
| GET/POST | `/block-products`        | blocks.read/write | list (search, `isActive`), create (`unitPrice`, `specs`) |
| GET/PATCH/DELETE | `/block-products/:id` | blocks.read/write | get / update / delete |
| GET/POST | `/block-productions`      | blocks.read/write | list (search, `productId`, `status`), create (`productId`, `quantity`, `producedOn`, `status`, `notes`) |
| GET/PATCH/DELETE | `/block-productions/:id` | blocks.read/write | get / update / delete |
| GET/POST | `/block-sales`             | blocks.read/write | list (search, `productId`, `status`), create (`productId`, optional `clientId`, `quantity`, `unitPrice`, `soldOn`, `reference`) — `totalAmount` computed server-side |
| GET/PATCH/DELETE | `/block-sales/:id`     | blocks.read/write | nested `product` + `client`; status editable |

Seed supplies idempotent demo data (categories, materials incl. 200 bags cement opening
stock, warehouses, block products, one `PRD-DEMO-0001` production batch, one sale
`SALE-DEMO-0001`) and grows the permission catalog to **30** (SUPER_ADMIN inherits).

## Endpoints (Phase 16 — Equipment & finance)

New permission set `equipment.read`/`equipment.write` and `finance.read`/`finance.write`
(SUPER_ADMIN inherits all). All models already exist in the Phase 3 baseline migration, so
**no new migration** was required. Business codes auto-generated: `EQP-`, `AST-`, `INV-`,
`RCP-`, `EXP-`, `TXN-`, `PAY-`.

### Equipment & fleet

| Method | Path                     | Permission | Notes |
| ------ | ------------------------ | ---------- | ----- |
| GET/POST | `/equipment`           | equipment.read/write | list (search, `status`, `category`), create (auto `EQP-` code; `name` required) |
| GET/PATCH/DELETE | `/equipment/:id`   | equipment.read/write | nested `vehicle` + `_count.maintenance`; soft delete |
| GET/POST | `/vehicles`            | equipment.read/write | list (search, `equipmentId`), create/upsert on unique `equipmentId` |
| GET/PATCH/DELETE | `/vehicles/:id`    | equipment.read/write | nested `equipment` + recent `fuelRecords` |
| GET/POST | `/maintenance`         | equipment.read/write | list (`equipmentId`, `status`), create (`equipmentId`, `scheduledAt` required) |
| GET/PATCH/DELETE | `/maintenance/:id` | equipment.read/write | nested `equipment` |
| POST | `/maintenance/:id/complete` | equipment.write | marks `COMPLETED` + sets `completedAt` |
| GET/POST | `/assets`              | equipment.read/write | list (search, `category`, `status`), create (auto `AST-` code) |
| GET/PATCH/DELETE | `/assets/:id`      | equipment.read/write | nested `_count.assignments`; soft delete |
| GET/POST | `/asset-assignments`   | equipment.read/write | list (`assetId`, `assignedToId`, `activeOnly`), create (`assetId`, `assignedToId` required) |
| GET/DELETE | `/asset-assignments/:id` | equipment.read/write | get / delete |
| POST | `/asset-assignments/:id/return` | equipment.write | sets `returnedAt` |

### Finance & accounting

| Method | Path                     | Permission | Notes |
| ------ | ------------------------ | ---------- | ----- |
| GET/POST | `/invoices`            | finance.read/write | list (search, `status`, `clientId`, `projectId`), create (auto `INV-` code; `clientId`, `dueOn` required; line items create; subtotal/tax/discount/total computed server-side) |
| GET/PATCH/DELETE | `/invoices/:id`    | finance.read/write | nested `client`, `project`, `items`; PATCH recomputes totals when tax/discount change |
| POST | `/invoices/:id/items`      | finance.write | add line item + refresh totals (DRAFT/SENT only) |
| DELETE | `/invoices/:id/items/:itemId` | finance.write | remove line item + refresh totals |
| GET/POST | `/receipts`            | finance.read/write | list (search, `clientId`, `invoiceId`, `method`), create (auto `RCP-` code) |
| GET/PATCH/DELETE | `/receipts/:id`    | finance.read/write | nested `client` + `invoice`; edit/delete re-reconciles invoice status |
| GET/POST | `/expenses`            | finance.read/write | list (search, `category`, `status`, `projectId`), create (auto `EXP-` code; `category`, `description`, `amount` required) |
| GET/PATCH/DELETE | `/expenses/:id`    | finance.read/write | nested `project`; status cast to `ExpenseStatus` |
| GET/POST | `/financial-transactions` | finance.read/write | list (search, `type`, `direction`, `status`, `category`, `projectId`), create (auto `TXN-` code; `type`, `direction`, `amount`, `category` required) |
| GET/PATCH/DELETE | `/financial-transactions/:id` | finance.read/write | get / update / delete |
| GET/POST | `/payments`            | finance.read/write | list (`payeeType`, `payeeId`, `status`, `method`), create (auto `PAY-` code; `payeeType`, `payeeId`, `amount` required) |
| GET/PATCH/DELETE | `/payments/:id`    | finance.read/write | get / update / delete |

Invoice payment status is **derived, not hand-set**: creating/editing/deleting a receipt
runs `reconcileInvoiceStatus`, which sets `PAID` when receipts cover `total`, `PART_PAID`
when partly covered, else `SENT` (skips `CANCELLED`/`VOID`). Seed grows the permission
catalog to **32** and adds idempotent demo data: `EQP-DEMO-0001` (Excavator 30t + vehicle
`GW-1234-20` + scheduled maintenance), `AST-DEMO-0001` (site laptop), `EXP-DEMO-0001` (fuel),
`INV-DEMO-0001` (2 line items) + `RCP-DEMO-0001` receipt.

## Endpoints (Phase 18 — Payroll & payslips)

New permission set `payroll.read`/`payroll.write` (SUPER_ADMIN inherits). Net pay is
computed **server-side** with Ghana statutory deductions — employee SSNIT 5.5% + progressive
PAYE across six brackets (annualised chargeable income ÷ 12); NHIL 2.75% and employer SSNIT
13% are returned as informational employer contributions, not take-home deductions. Money is
`Decimal(18,2)`, serialised as JSON strings.

### Pay periods
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET/POST | `/payroll-periods` | payroll.read/write | list (search on `name`, `status` filter), create (`name`, `startDate`, `endDate`) |
| GET/PATCH/DELETE | `/payroll-periods/:id` | payroll.read/write | nested `payrolls` + `payslips`; meta editable only while `DRAFT`; hard delete refused once runs exist / status > DRAFT |
| POST | `/payroll-periods/:id/generate` | payroll.write | create one `Payroll` per ACTIVE salaried employee not already covered (unique `[periodId, employeeId]`); returns `{ created }` |
| POST | `/payroll-periods/:id/process` | payroll.write | set runs + period to `PROCESSED`, stamp `processedById`/`processedAt`, close the period |
| POST | `/payroll-periods/:id/issue-payslips` | payroll.write | one `Payslip` per processed run (auto `PSL-` code, copies gross/deductions/net, status `PAID`), idempotent |

### Payroll runs
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET/POST | `/payrolls` | payroll.read/write | list (`periodId`, `employeeId`, `status`, `search`) |
| GET/PATCH/DELETE | `/payrolls/:id` | payroll.read/write | nested `employee` + `period`; PATCH adjusts a `DRAFT` run's `grossPay` and recomputes deductions + net; DELETE is a soft delete |

### Payslips
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET | `/payslips` | payroll.read | list (`periodId`, `employeeId`, `status`, `search` on `payslipNo`) |
| GET/DELETE | `/payslips/:id` | payroll.read/write | nested `employee` + `period`; DELETE is a hard delete |

### Staff self-service (no permission — powers `/staff/payslips`)
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET | `/staff/payslips` | authenticated only | the caller's own payslips (resolved via `User.employeeId`), newest first |
| GET | `/staff/payslips/:id` | authenticated only | only a slip owned by the caller; 404 otherwise |

Seed grows the permission catalog to **34** and adds idempotent demo payroll: period
**"August 2026"** (PROCESSED), a computed payrun (gross 4500 → net 3687.40) and
`PSL-DEMO-0001` (PAID) so both portals render content on first boot.

## Endpoints (Phase 19 — Employee IDs & QR verification)

New permission set `employee-ids.read`/`employee-ids.write` (SUPER_ADMIN inherits). Cards are
physical staff IDs carrying a QR that encodes a **public verify URL**; each scan of a
recognised card is logged (an unrecognised number returns `INVALID` without a row, since
`cardNumber`/`employeeId` are required foreign keys).
`qrToken` is an opaque one-time secret embedded in the QR at issue time — re-issuing revokes
the old card and mints a fresh token.

### Employee ID cards
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET/POST | `/employee-ids` | employee-ids.read/write | paginated list (`search` on card number / employee name / staff code, `status`, `employeeId`); POST issues a card (`employeeId`, optional `expiresAt`) — revokes any live card first and links via `replacedById` |
| GET | `/employee-ids/:id` | employee-ids.read | nested `employee` (code, dept, position, branch) + latest 20 `verifications` |
| POST | `/employee-ids/:id/revoke` | employee-ids.write | idempotent mark as `REVOKED` |

### Public verification (no token — powers the guard's `/verify/employee-id` page)
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| POST | `/employee-ids/verify` | `@Public()` | body `{ card, t }`; constant-time token compare → `VERIFIED` / `REVOKED` / `EXPIRED` / `INVALID`; logs an `EmployeeIDVerification` row (method `QR`, IP) for every recognised card; returns public identity only |

### Staff self-service (no permission — powers `/staff/employee-id`)
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET | `/staff/employee-id` | authenticated only | the caller's own latest card (resolved via `User.employeeId`) |

Seed grows the permission catalog to **36** and adds an idempotent demo card
`EID-DEMO-0001` (status `VERIFIED`) for `EMP-DEMO-0001`, so the card PDF, the admin list and
the staff page render content on first boot.

## Endpoints (Phase 21 — Notifications & documents)

Two new permissions (`documents.read`, `documents.write`) grow the seed catalog to **38**
(SUPER_ADMIN inherits both automatically). Notifications carry no permission decorators —
every call is scoped to the bearer token's `userId`, so admin, staff and client reuse the
same endpoints.

### Notifications (self-scoped — powers the bell in all three portals)
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET | `/notifications` | authenticated | caller's own feed (`search` on title, `unreadOnly`, paginated) with `meta.totalUnread` |
| GET | `/notifications/unread-count` | authenticated | `{ totalUnread }` — the bell badge |
| POST | `/notifications/read-all` | authenticated | marks every unread row read for the caller, returns `{ updated }` |
| POST | `/notifications/:id/read` | authenticated | mark one notification read (ownership-checked, idempotent) |

The shared `NotificationsService.notify({ userId, type, title, body, data, link })` is
how every other module raises alerts (projects already use it): recipients that are
disabled, deleted or missing are skipped silently.

### Documents (no migration — models exist since Phase 3)
| Route | Permissions | Notes |
| ----- | ------ | ----- |
| GET | `/documents` | documents.read | paginated library: `search` (title), `status`, `category`; rows carry `_count.versions` and resolved `uploaderName` |
| GET | `/documents/:id` | documents.read | current file + `versions` (asc) + `access` grants (newest first) |
| POST | `/documents` | documents.write | multipart (`file` → self-hosted upload, uuid filename, allow-listed extension, ≤ 20 MB) **or** `url`; creates `v1` |
| POST | `/documents/:id/versions` | documents.write | next numeric version; optional `note`; multipart `file` or `url` |
| POST | `/documents/:id/status` | documents.write | body `{ status: DRAFT\|FINAL\|SUPERSEDED\|ARCHIVED }` |
| POST | `/documents/:id/access` | documents.write | body `{ principalType: CLIENT\|STAFF\|ROLE\|USER, principalId, permission: VIEW\|EDIT }` — upserts on `[documentId, principalType, principalId]` |
| DELETE | `/documents/:id/access/:principalType/:principalId` | documents.write | revoke a grant, returns `{ revoked }` |
| DELETE | `/documents/:id` | documents.write | soft delete (sets `deletedAt`) |

Uploaded files are stored under `services/api/uploads/documents/` (override
`UPLOADS_DIR`) and served statically at `/uploads/documents/...` from `app.factory.ts`;
the stored URL is always `/uploads/documents/<uuid><ext>`, never the client's basename.

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
| `projects` (lifecycle: planning, budgets, milestones, work log, team) | **Phase 12 — done** |
| `land`              | Phase 13 — done |
| `materials`, `inventory`, `blocks` | Phase 15 — done |
| `equipment`, `vehicles`, `maintenance`, `assets` | Phase 16 — done |
| `finance`, `invoices`, `receipts`, `expenses`, `payments` | Phase 16 — done |
| `payroll`           | Phase 18 — done |
| `employee-ids`      | Phase 19 — done |
| `documents`, `notifications` | Phase 21 — done |

**No fake endpoints.** Real business, DB-backed, permission-checked modules are added
phase by phase; placeholder-only routes are not exposed as if complete.
