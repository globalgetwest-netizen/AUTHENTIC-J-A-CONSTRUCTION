import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/app.factory';

// Public routes are reachable without a token, so the global validation pipe
// must reject malformed payloads with a 400 envelope BEFORE any service/database
// work runs. A malformed request that reaches the DB would fail here (no
// Postgres in the unit/e2e suite), so a 400 — not a 5xx — is the contract.
const INVALID_PAYLOADS: ReadonlyArray<readonly [string, string, object, string[]]> = [
  [
    'POST /api/v1/requests with an empty body',
    '/api/v1/requests',
    {},
    ['requestType', 'fullName', 'email', 'phone'],
  ],
  [
    'POST /api/v1/requests with an unknown request type',
    '/api/v1/requests',
    { requestType: 'bogus', fullName: 'Ama Mensah', email: 'ama@example.com', phone: '0241234567' },
    ['requestType'],
  ],
  [
    'POST /api/v1/requests with an invalid email',
    '/api/v1/requests',
    { requestType: 'quote', fullName: 'Ama Mensah', email: 'not-an-email', phone: '0241234567' },
    ['email'],
  ],
  [
    'POST /api/v1/requests with a non-enum contact method',
    '/api/v1/requests',
    {
      requestType: 'quote',
      fullName: 'Ama Mensah',
      email: 'ama@example.com',
      phone: '0241234567',
      preferredContactMethod: 'pigeon',
    },
    ['preferredContactMethod'],
  ],
  [
    'POST /api/v1/auth/login with an empty body',
    '/api/v1/auth/login',
    {},
    ['email', 'password'],
  ],
  [
    'POST /api/v1/auth/login with a malformed email',
    '/api/v1/auth/login',
    { email: 'not-an-email', password: 'secret' },
    ['email'],
  ],
  [
    'POST /api/v1/employee-ids/verify with an empty body',
    '/api/v1/employee-ids/verify',
    {},
    ['card', 't'],
  ],
  [
    'POST /api/v1/employee-ids/verify with an over-length token',
    '/api/v1/employee-ids/verify',
    { card: 'EID-0001', t: 'x'.repeat(300) },
    ['t'],
  ],
  [
    'POST /api/v1/employee-ids/verify with an over-length card number',
    '/api/v1/employee-ids/verify',
    { card: 'x'.repeat(100), t: 'token' },
    ['card'],
  ],
];

describe('Public route validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(INVALID_PAYLOADS)('%s -> 400', async (_label, path, body, expected) => {
    const res = await request(app.getHttpServer()).post(path).send(body).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(res.body.path).toBe(path);
    const message = Array.isArray(res.body.message) ? res.body.message.join(', ') : '';
    for (const token of expected) {
      expect(message).toContain(token);
    }
  });
});
