import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ajac/database';

/**
 * Nest wrapper around the shared Prisma client. Construction is lazy-safe: the
 * client does not connect until the first query, so the API boots (health,
 * validation, error handling) even before a database is configured. Queries
 * surface Prisma's own errors, which the global exception filter normalizes.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;
    super({
      log: ['warn', 'error'],
      ...(url ? { datasources: { db: { url } } } : {}),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
