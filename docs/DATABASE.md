# Database

PostgreSQL 16 + **Prisma ORM**. The schema lives in
`packages/database/prisma/schema.prisma` and is fully implemented for **Phase 3**:
~70 models across every entity group in the master specification.

## Layout

```
packages/database/
├── prisma/
│   ├── schema.prisma            # source of truth (models + enums)
│   └── migrations/
│       ├── migration_lock.toml  # provider = "postgresql"
│       └── 20260804000000_init/ # baseline migration (generated SQL)
├── src/
│   ├── generated/client/        # prisma generate output (gitignored)
│   ├── index.ts                 # createPrismaClient() + dev singleton + re-exports
│   └── index.test.ts            # client factory + enum/model integrity tests
├── .env                         # DATABASE_URL (gitignored; see .env.example)
└── package.json
```

The client is generated into the package (`prisma-client-js` generator, output
`src/generated/client`) and re-exported from `src/index.ts`, so other workspaces
import models, enums, and `PrismaClient` via `@ajac/database`.

## Conventions (applied to every model)

- `String @id @default(uuid())` primary key
- `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on all models
- Soft delete via `deletedAt DateTime?` where appropriate (queries filter `deletedAt: null`)
- Foreign keys on all relations; indexes on FKs and common lookup columns
- `unique` constraints on business keys (email, employee code, property ref, etc.)
- **Database transactions** for financial and critical multi-write workflows
- Money is `Decimal @db.Decimal(18,2)`; quantities `Decimal @db.Decimal(14,3)`
- Passwords are never stored in plaintext (see `packages/auth`)

## Entity groups (implemented)

- **Identity & access**: User, Role, Permission, RolePermission, UserRole, Session,
  RefreshToken, AuditLog
- **Company**: Company, CompanyBranch, Department, Position
- **People**: Employee, EmployeeDocument, EmployeeID, EmployeeIDVerification, Client,
  ClientDocument
- **Projects**: Project, ProjectMember, ProjectMilestone, ProjectTask, ProjectDocument,
  ProjectUpdate, ProjectPhoto, ProjectReport, ProjectInspection, ProjectSafetyIncident,
  ProjectBudget, ProjectExpense
- **Real estate**: PropertyType, Property, PropertyListing, PropertyImage,
  PropertyDocument, PropertyInquiry, PropertyReservation, PropertySale, PropertyRental
- **Land**: LandProject, LandPlot, LandAllocation, LandDocument, LandPayment
- **Materials & blocks**: MaterialCategory, Material, Warehouse, Inventory,
  InventoryTransaction, StockMovement, BlockProduct, BlockProduction, BlockSale
- **Procurement/supply**: Supplier, SupplierContact, PurchaseRequest, PurchaseOrder,
  GoodsReceipt, Contractor, Contract
- **Equipment**: Equipment, Vehicle, Asset, MaintenanceRecord, FuelRecord, AssetAssignment
- **HR/payroll**: EmployeeAttendance, LeaveRequest, PayrollPeriod, Payroll, Payslip,
  PaymentRecord
- **Finance**: Invoice, InvoiceItem, Receipt, Expense, FinancialTransaction
- **CRM**: Lead, CRMActivity, Quotation, QuotationItem
- **Documents**: Document, DocumentVersion, DocumentAccess
- **Notifications**: Notification, Conversation, ConversationParticipant, Message
- **System**: SystemSetting, FeatureFlag

About 45 enums cover employment types, project statuses, payment methods, lead stages,
property/land statuses, leave types, etc. (e.g. `EmploymentType`, `ProjectStatus`,
`PaymentMethod`, `LeadStage`).

## Migrations

The baseline migration was authored with `prisma migrate diff --from-empty
--to-schema-datamodel --script` because there is no local Postgres on this Windows
machine. It is applied against the real database in CI via `prisma migrate deploy`
(see `.github/workflows/ci.yml`, which starts a `postgres:16-alpine` service and runs
`prisma generate` + `prisma migrate deploy` before typecheck/lint/test/build).

## Local database

`docker compose -f infrastructure/docker/docker-compose.yml up -d`
(starts Postgres 16 + Adminer on :8081), then:

```sh
cd packages/database
npx prisma migrate dev     # apply migrations + generate client
npx prisma studio          # browse data
```

## Package scripts

| Script           | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `generate`       | `prisma generate` (builds the client)          |
| `validate`       | `prisma validate` (schema check)               |
| `migrate:dev`    | `prisma migrate dev` (dev: apply + generate)   |
| `migrate:deploy` | `prisma migrate deploy` (CI/prod: apply only)  |
| `db:push`        | `prisma db push` (no migration history)        |
| `studio`         | `prisma studio`                                |
| `test`           | vitest: client factory + enum/model integrity  |
| `typecheck`      | `tsc --noEmit`                                 |
| `lint`           | ESLint                                         |
| `build`          | `tsc` (emits into `dist`)                      |
