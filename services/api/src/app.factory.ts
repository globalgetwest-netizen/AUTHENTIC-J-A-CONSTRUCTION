import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Builds and configures the Nest application (shared by bootstrap and tests).
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  // Versioned API under one prefix. OpenAPI/Swagger arrives with the API docs phase.
  app.setGlobalPrefix('api/v1');

  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.WEB_URL ?? '*';
  const origin = rawOrigins === '*' ? true : rawOrigins.split(',').map((o) => o.trim());
  app.enableCors({ origin, credentials: true });

  // Validate + strip unknown properties on every request DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // One error envelope for every route (HTTP, validation, Prisma, unknown).
  app.useGlobalFilters(new AllExceptionsFilter());

  return app;
}