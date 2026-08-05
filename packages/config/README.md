# @ajac/config

Shared tooling configuration for the AUTHENTIC J.A. CONSTRUCTION LTD. monorepo.

- `eslint.config.mjs` — canonical ESLint flat config (typescript-eslint) reused across workspace packages.
- `tsconfig.json` — convenience package extending the repo root `tsconfig.base.json`.

The root `tsconfig.base.json` is the single source of truth for strict TypeScript settings.