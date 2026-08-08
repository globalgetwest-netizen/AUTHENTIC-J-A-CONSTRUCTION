import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
    // The ambient shell (e.g. a tool harness) may carry NODE_ENV=production,
    // which would make auth-config throw for missing JWT secrets and fail the
    // suite. Tests always run as 'test'.
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**'],
      // Wiring and declarative scaffolding are excluded: seed is a dev utility,
      // DTOs are class-validator declarations, modules are DI glue, main.ts is
      // the bootstrap and prisma.service is a thin client wrapper.
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/seed/**',
        'src/**/dto/**',
        'src/prisma/**',
      ],
      // Global floor measured on `npm run test:coverage` (2026-08-08). Kept
      // below the measured 57.7/50.5/46.7/61.0 so the gate passes today but
      // fails on real regression — raise these as coverage grows.
      thresholds: {
        statements: 55,
        branches: 48,
        functions: 44,
        lines: 58,
      },
    },
  },
  esbuild: {
    // Nest relies on design:paramtypes for dependency injection; esbuild does
    // not emit decorator metadata unless the tsconfig options are provided.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
});