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
  minutes (in-memory; resets on restart).
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
  the API layer (added alongside each module; hardened in Phase 23 — see below).
- Secure cookies; secrets via environment variables / a production secret manager.
- **Baseline security headers** on every API response (`X-Content-Type-Options:
  nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
  `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none`, `X-XSS-Protection: 0`, and
  `Content-Security-Policy: default-src 'none'` — the API serves no active
  content), plus the same core headers on the web app (`next.config.ts`
  `headers()`, with `Strict-Transport-Security` added in production). The
  Express `X-Powered-By` fingerprint is disabled.
- **CORS is closed by default**: cross-origin browser access requires an explicit
  allowlist (`CORS_ORIGINS`, else `WEB_URL`). With none configured the API
  refuses cross-origin calls (`origin: false`) and never sets
  `Access-Control-Allow-Credentials` — no reflected-origin + credentials. Native
  clients are unaffected, and the web app proxies the API server-side.
- **Per-IP rate limiting on public endpoints** (`POST /requests`,
  `POST /employee-ids/verify`): dependency-free in-memory limiter, 30 req/min per
  IP, 429 + `Retry-After`. Mounted before validation, so malformed spam still
  consumes budget. Authenticated routes rely on login throttling instead.
- **Document URL scheme validation**: document links may only be `http(s)://` or a
  server-relative `/path` — `javascript:`, `data:`, and protocol-relative
  `//host` are rejected at the DTO boundary.

## Sensitive data

- **Corporate Document Vault**: Certificate of Incorporation, registration docs, and
  other confidential records are admin-restricted and never public. Uploaded files
  are **not served from a public `/uploads` mount** — they are streamed only through
  the permission-gated `GET /documents/:id/file` endpoint (see Phase 23 below), and
  the stored path is re-checked against the uploads directory on every read.
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

## Phase 23 — Security audit

Findings from the Phase 23 security audit and their remediation. All changes are
covered by regression tests (`services/api/test/security.spec.ts`,
`uploads.spec.ts`, `documents-file.spec.ts`, `documents.dto.spec.ts`; the
`/documents/:id/file` route was also added to the unauthenticated-boundary suite).

| # | Severity | Finding | Remediation |
|---|----------|---------|-------------|
| A | **High** | Uploaded documents (incl. confidential corporate docs) were served unauthenticated at the public static `/uploads` mount, contradicting the Document Vault policy. | Removed the public mount. Added authenticated, permission-gated `GET /documents/:id/file` (streams via `StreamableFile`, extension-derived Content-Type, sanitized filename, path-containment check on every read). The web admin `/file` proxy now calls this endpoint with the bearer token. |
| B | **Medium** | CORS reflected any `Origin` with `credentials: true`. | CORS now requires an explicit allowlist (`CORS_ORIGINS`/`WEB_URL`); with none configured, cross-origin access and credentials are refused. |
| C | **Medium** | No security headers on API or web; Express `X-Powered-By` fingerprint present. | Baseline headers on the API (nosniff, frameguard, referrer-policy, COOP/CORP, CSP `default-src 'none'`) and web (`next.config.ts` headers, HSTS in production); `x-powered-by` disabled. |
| D | **Medium** | Document `url` fields accepted arbitrary schemes (`javascript:`, `data:`, `//host`). | DTO `@Matches` validation: only `http(s)://` or server-relative `/path` allowed. |
| E | **Medium** | Public mutation endpoints (lead intake, employee-ID verify) had no rate limit. | Dependency-free in-memory per-IP limiter (30 req/min), 429 + `Retry-After`, mounted before validation. |

Auth (scrypt, JWT refresh rotation + reuse detection, DB-reloaded RBAC, login
throttling, generic 401s) and cookie settings were audited and found sound.

Known remaining hardening (deferred, not regressions):
- The public-endpoint rate limiter is in-memory and keyed on `req.ip`; behind a
  reverse proxy set `trust proxy` so clients do not share one bucket, and
  consider a shared store (e.g. Redis) for horizontal scaling.
- The web app's CSP is deferred to production hardening (needs a full
  nonce/hash inventory before a strict policy is safe to ship).
- Web documents are proxied via `Buffer` in memory; switch to streaming if very
  large uploads (20 MB cap today) become a concern.