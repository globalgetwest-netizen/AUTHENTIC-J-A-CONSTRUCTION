# Deployment

## Local development

```bash
npm install
cp .env.example .env                                   # fill DATABASE_URL + secrets
docker compose -f infrastructure/docker/docker-compose.yml up -d
npm run dev                                            # web :3000 · api :4000 · mobile (Expo)
```

Health checks: web `http://localhost:3000/api/health`, api `http://localhost:4000/api/v1/health`.

## Quality gates (must pass before deploy)

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI runs all four on every push/PR (`.github/workflows/ci.yml`). **Never deploy failing code.**

## Environments

- `development` — local Docker (above)
- `staging` — to be added in **Phase 23**
- `production` — to be added in **Phase 23**

## Target production architecture (planned — Phase 23)

| Layer      | Planned host                                                |
| ---------- | ------------------------------------------------------------ |
| Web        | Vercel or Node host for Next.js                              |
| API        | Production Node.js hosting (VPS / container / PAAS)          |
| Database   | Managed PostgreSQL with **automated backups**                |
| Storage    | Secure object storage (S3-compatible), signed URLs           |
| DNS / edge | Cloudflare (or equivalent) + HTTPS everywhere                |

## Variables

The full variable list is in `.env.example` (database, auth/JWT secrets, storage,
email, push, payments, maps, feature flags). Production secrets are injected via a
secret manager / CI secrets — never committed.

## Backups & disaster recovery (Phase 23)

Planned but not yet defined: backup **frequency**, **retention**, **recovery process**,
and a written **DR procedure**. These will be documented here when the managed
environment is chosen.