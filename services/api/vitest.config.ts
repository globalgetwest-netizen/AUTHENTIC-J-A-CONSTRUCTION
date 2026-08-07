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