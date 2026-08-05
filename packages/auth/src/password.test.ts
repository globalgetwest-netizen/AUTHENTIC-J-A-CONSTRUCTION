import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing (scrypt)', () => {
  it('round-trips a valid password', async () => {
    const encoded = await hashPassword('Correct Horse Battery Staple');
    await expect(verifyPassword('Correct Horse Battery Staple', encoded)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const encoded = await hashPassword('Correct Horse Battery Staple');
    await expect(verifyPassword('wrong password', encoded)).resolves.toBe(false);
  });

  it('rejects a tampered hash', async () => {
    const encoded = await hashPassword('Correct Horse Battery Staple');
    const [scheme, cost, r, p, salt, hash] = encoded.split(':');
    // Flip the final hex nibble so the stored digest no longer matches.
    const flipped = hash?.slice(0, -1) + (hash?.endsWith('0') ? '1' : '0');
    await expect(verifyPassword('Correct Horse Battery Staple', [scheme, cost, r, p, salt, flipped].join(':'))).resolves.toBe(
      false,
    );
  });

  it('rejects malformed stored values', async () => {
    await expect(verifyPassword('whatever', 'not-a-valid-format')).resolves.toBe(false);
  });

  it('produces unique salts per hash', async () => {
    const a = await hashPassword('same password');
    const b = await hashPassword('same password');
    expect(a).not.toBe(b);
  });
});