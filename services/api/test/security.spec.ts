import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/app.factory';

/**
 * Regression tests for the Phase 23 security hardening:
 *  - uploaded documents are no longer served from a public /uploads mount
 *  - baseline security headers (and no X-Powered-By fingerprint) on every route
 *  - CORS stays closed by default (no reflected-origin + credentials)
 *  - public mutation endpoints are rate-limited per IP
 */
describe('API security surface', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('no longer serves the uploads tree publicly', async () => {
    const res = await request(app.getHttpServer()).get('/uploads/documents/any.pdf');
    expect(res.status).toBe(404);
    expect(res.body).not.toHaveProperty('fileUrl');
  });

  it('sends baseline security headers on every response', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['content-security-policy']).toBe("default-src 'none'");
    // Express fingerprint suppressed.
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('keeps CORS closed by default (no reflected origin, no credentials)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('rate-limits the public request endpoint after the per-IP budget', async () => {
    // Budget is 30/min (app.factory). All 40 calls share one IP bucket; the
    // first 30 pass validation (empty body → 400), the rest are throttled with
    // a Retry-After header. A fresh app instance keeps this deterministic.
    const statuses: number[] = [];
    let throttledBody: { statusCode?: number } | undefined;
    let retryAfter: string | undefined;
    for (let i = 0; i < 40; i += 1) {
      const res = await request(app.getHttpServer()).post('/api/v1/requests').send({});
      statuses.push(res.status);
      if (res.status === 429) {
        throttledBody = res.body as { statusCode?: number };
        retryAfter = res.headers['retry-after'] as string | undefined;
      }
    }

    expect(statuses).toHaveLength(40);
    expect(statuses[0]).toBe(400);
    expect(statuses[29]).toBe(400);
    expect(statuses.slice(30).every((s) => s === 429)).toBe(true);
    expect(throttledBody).toMatchObject({ statusCode: 429, error: 'Too Many Requests' });
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });
});
