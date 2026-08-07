import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.factory';

/**
 * Loads the API's local env file (`services/api/.env` in dev, fallback to the
 * repo-root `.env`). Without this, `process.env` only reflects the ambient
 * shell, so a stray `PORT` set elsewhere would hijack the API's port and
 * `DATABASE_URL`/JWT secrets would silently be missing. Node's built-in loader
 * never overrides an already-set variable — ambient values still win.
 */
function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../../.env'),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      process.loadEnvFile(path);
      return;
    }
  }
}

void loadEnv();

async function bootstrap(): Promise<void> {
  const app = await createApp();
  // API_PORT is authoritative; fall back to PORT (ambient convention) then 4000.
  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(
    `[${process.env.NODE_ENV ?? 'development'}] AUTHENTIC J.A. API → http://localhost:${port}/api/v1`,
  );
}

void bootstrap();
