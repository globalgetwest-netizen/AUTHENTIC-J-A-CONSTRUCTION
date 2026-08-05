import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApp } from './app.factory';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns ok for the service', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'authentic-ja-api' });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns a consistent 404 envelope for an unknown route', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    expect(res.body.path).toBe('/api/v1/does-not-exist');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('rejects unauthenticated access to a protected route with a 401 envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/clients').expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
    expect(res.body.path).toBe('/api/v1/clients');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('rejects an invalid body on the public login route with a 400 envelope', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({}).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.join(', ')).toContain('email');
  });

  it('validates the public website request route without authentication', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/requests').send({}).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    const message = Array.isArray(res.body.message) ? res.body.message.join(', ') : '';
    expect(message).toContain('requestType');
    expect(message).toContain('fullName');
  });

});
