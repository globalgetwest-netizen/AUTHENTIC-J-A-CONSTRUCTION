import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import type { RequestHandler } from 'express';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { rateLimit } from './common/middleware/rate-limit';
import { ensureUploadsDir } from './common/storage/uploads';

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

  // Document uploads stay on disk and are ONLY reachable through the
  // authenticated, permission-gated `GET /documents/:id/file` endpoint. There
  // is deliberately no public static /uploads mount: confidential corporate
  // documents must never be fetchable without a token (see SECURITY.md).
  ensureUploadsDir();

  // Versioned API under one prefix. OpenAPI/Swagger arrives with the API docs phase.
  app.setGlobalPrefix('api/v1');

  // Hardening: baseline security headers on every API response + suppress the
  // Express fingerprint header (only reachable through the underlying app).
  app.use(securityHeaders);
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // Public endpoints that mutate state without a token are spam-able (lead
  // intake, employee-ID lookups), so give them a per-IP budget before
  // validation runs. Authenticated endpoints stay unlimited.
  const publicLimiter = rateLimit({ windowMs: 60_000, max: 30 });
  app.use('/api/v1/requests', publicLimiter);
  app.use('/api/v1/employee-ids/verify', publicLimiter);

  // CORS is only opened to explicitly configured origins (CORS_ORIGINS, else
  // WEB_URL). With no config the API refuses cross-origin browser calls
  // entirely (origin: false) and never sets credentials. Native/mobile clients
  // are unaffected (no browser CORS), and the web app proxies the API
  // server-side, so nothing legitimate needs reflected-origin credentials.
  const rawOrigins = process.env.CORS_ORIGINS ?? process.env.WEB_URL ?? '';
  const allowed = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowed.length > 0 ? allowed : false, credentials: allowed.length > 0 });

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

/**
 * Baseline security headers for a JSON/file API. Content-Security-Policy is
 * locked to `default-src 'none'` because the API serves no active content —
 * even a reflection XSS cannot fetch a script to run it.
 */
const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  next();
};
