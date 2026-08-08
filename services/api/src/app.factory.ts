import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, static as expressStatic } from 'express';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ensureUploadsDir, UPLOADS_DIR } from './common/storage/uploads';

/**
 * Builds and configures the Nest application (shared by bootstrap and tests).
 */
export async function createApp(): Promise<INestApplication> {
  // Body parsing is wired below with an explicit limit: self-hosted uploads
  // (schematic diagrams, signed documents, images) arrive as JSON/base64 and
  // regularly exceed Express's default 100kb body limit, which surfaced as
  // `PayloadTooLargeError`. Raise it to a self-hosted-friendly cap.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '25mb' }));

  // Self-hosted document storage: make the uploads tree public-over-HTTP at
  // /uploads (outside the /api/v1 prefix, matching the stored fileUrl paths).
  ensureUploadsDir();
  app.use('/uploads', expressStatic(UPLOADS_DIR, { maxAge: '1h', immutable: false }));

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