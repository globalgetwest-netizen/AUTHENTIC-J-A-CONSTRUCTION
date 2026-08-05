import { describe, expect, it } from 'vitest';
import { generateSecret, signToken, verifyToken } from './jwt';

const secret = 'a'.repeat(48);
const claims = { role: 'ADMIN', email: 'ops@example.com' };

describe('jwt (jose, HS256)', () => {
  it('signs and verifies a token', async () => {
    const token = await signToken(secret, 'user-123', claims, 3600);
    const verified = await verifyToken(secret, token);
    expect(verified.sub).toBe('user-123');
    expect(verified.role).toBe('ADMIN');
    expect(verified.email).toBe('ops@example.com');
    expect(verified.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken(secret, 'user-123', claims, 3600);
    await expect(verifyToken('b'.repeat(48), token)).rejects.toThrow();
  });

  it('rejects a tampered token', async () => {
    const token = await signToken(secret, 'user-123', claims, 3600);
    const tampered = `${token.slice(0, -4)}AAAA`;
    await expect(verifyToken(secret, tampered)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const token = await signToken(secret, 'user-123', claims, -60);
    await expect(verifyToken(secret, token)).rejects.toThrow();
  });

  it('generates a strong secret', () => {
    expect(generateSecret(48)).toMatch(/^[0-9a-f]{96}$/);
  });
});