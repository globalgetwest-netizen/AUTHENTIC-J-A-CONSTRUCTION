import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
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