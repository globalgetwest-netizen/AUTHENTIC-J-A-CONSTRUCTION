# Deployment (placeholder)

This directory will hold production deployment definitions (Terraform, CDK,
Dockerfiles, container orchestration, and app-specific hosting configs) in
**Phase 23 (Production deployment)**.

## Target architecture (planned)

| Layer       | Planned host                                                     |
| ----------- | ---------------------------------------------------------------- |
| Web         | Vercel (or a Node host for the Next.js static/server output)     |
| API         | Production Node.js hosting (VPS / container / PAAS)              |
| Database    | Managed PostgreSQL (with automated backups)                      |
| Storage     | Secure object storage (S3-compatible) with signed URLs           |
| DNS / edge  | Cloudflare (or equivalent) + HTTPS everywhere                     |
| CI/CD       | GitHub Actions (see `.github/workflows/ci.yml`)                   |

## Environments

- `development` — local Docker stack (`infrastructure/docker/docker-compose.yml`)
- `staging` — added in Phase 23
- `production` — added in Phase 23

The authoritative deployment runbook lives in `docs/DEPLOYMENT.md`.