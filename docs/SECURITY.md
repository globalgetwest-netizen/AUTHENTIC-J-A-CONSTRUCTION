# Security

## Authentication (Phase 5)

- Passwords hashed with Node's built-in **scrypt** (memory-hard, no native
  compilation) — see `packages/auth` (`hashPassword` / `verifyPassword`).
  **Never store plaintext passwords.** Never log passwords or tokens.
- **Transport**: short-lived HS256 **access token** sent as `Authorization:
  Bearer <token>` (shared by the web portals and the mobile app — no cookie
  parsing / CSRF on ambient credentials).
- **Refresh rotation with reuse detection**: an opaque refresh token (48 random
  bytes) is stored only as a **sha256 hash** in the `Session` table. Every refresh
  revokes the presented session and issues a new pair; presenting an already-
  revoked token is treated as a theft signal and revokes **all** of that user's
  sessions. Logout revokes the session; password changes revoke every session.
- **Login throttling**: 5 failed attempts per email+IP locks that key for 15
  minutes (in-memory; resets on restart — Redis-backed hardening lands in
  Phase 22).
- Failed logins return a generic `Invalid email or password` so the response never
  reveals whether an email is registered. Login, refresh, and health are `@Public()`;
  everything else requires a valid bearer token.
- **Environment**: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`
  (900s), `JWT_REFRESH_TTL` (2 592 000s), plus `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD` for the bootstrap admin (`npm run seed --workspace=@ajac/api`).
  Secrets are dev-fallback generated once per boot; production fails fast if missing.

## Authorization (RBAC)

- Roles + permissions enforced by backend **guards** — never by the frontend alone.
- Two global guards run on every request: `AuthGuard` (validates the bearer token)
  then `PermissionsGuard` (enforces `@RequirePermissions('module.action')`). Routes
  without permission metadata are authenticated-only.
- Roles and permissions are **reloaded from the database on every request**, so
  deactivation, role, and permission changes take effect immediately.
- The `SUPER_ADMIN` role is granted every permission by seeding — there is no
  hard-coded admin bypass in the guards.
- Scope: SUPER_ADMIN, ADMIN, MANAGEMENT, STAFF, EMPLOYEE, CLIENT (Phase 5).
- Sensitive mutations (login, refresh, logout, password change, user/role writes)
  are recorded to the `AuditLog` table with actor, IP, and user agent.

## Transport & API defense

- HTTPS everywhere in production.
- CSRF mitigation, rate limiting, input validation, SQL-injection/XSS protection on
  the API layer (added alongside each module; hardening pass in Phase 22).
- Secure cookies; secrets via environment variables / a production secret manager.

## Sensitive data

- **Corporate Document Vault**: Certificate of Incorporation, registration docs, and
  other confidential records are admin-restricted and never public.
- **Payslips / payroll / banking**: access is permission-gated; employees see only
  their own records. Banking/payment channels are stored in the DB and only
  admin-marked `PUBLIC` channels appear on the public website.

## Secrets

- `.env` files are gitignored. `.env.example` is the canonical variable list.
  **Never commit real secrets** (see `.env.example` comments).
- Production uses a secret manager / CI secrets.

## Data integrity

- Financial records are never silently deleted — use reversals/corrections with audit
  trail.
- **No fabricated data.** Real data only; admin-configurable CMS fields for anything
  not yet provided. Official logo/letterhead/incorporation docs are never altered.

## Audit & logging

- Audit logs for sensitive actions; application/API logging without passwords or tokens
  (Phase 20 / 22).