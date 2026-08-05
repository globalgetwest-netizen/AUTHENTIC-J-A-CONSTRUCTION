/**
 * AUTHENTIC J.A. — database package.
 *
 * Exposes the generated Prisma client for the relational schema in
 * `prisma/schema.prisma`. Apps own connection lifetime: use `createPrismaClient`
 * (or the dev `prisma` singleton) rather than constructing bare clients in
 * several places. Enums, model types and the full `Prisma` namespace are
 * re-exported from the generated client.
 */
export * from './generated/client';

import { PrismaClient } from './generated/client';

export { PrismaClient };

export type PrismaLogLevel = 'query' | 'info' | 'warn' | 'error';

export interface CreatePrismaClientOptions {
  /** Which Prisma log levels to surface. @default ['warn', 'error'] */
  log?: PrismaLogLevel[];
  /** Override DATABASE_URL for this instance. */
  url?: string;
}

export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  const { log = ['warn', 'error'], url } = options;
  return new PrismaClient({
    log,
    datasources: url ? { db: { url } } : undefined,
  });
}

declare global {
  var __ajacPrisma: PrismaClient | undefined;
}

/** Development singleton — reuses one connection across hot reloads. */
export const prisma: PrismaClient =
  globalThis.__ajacPrisma ?? (globalThis.__ajacPrisma = createPrismaClient());
