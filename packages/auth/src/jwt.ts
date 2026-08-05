import { randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export interface VerifiedToken {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export type TokenClaims = Record<string, unknown>;

/** Generates a cryptographically random secret, hex-encoded. */
export function generateSecret(byteLength = 48): string {
  return randomBytes(byteLength).toString('hex');
}

function toKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Signs a JWT (HS256) for the given subject. `expiresInSeconds` is relative to now.
 */
export async function signToken(
  secret: string,
  subject: string,
  claims: TokenClaims,
  expiresInSeconds: number,
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(toKey(secret));
}

/**
 * Verifies a JWT. Throws on invalid signature or expired/not-yet-valid token.
 */
export async function verifyToken(secret: string, token: string): Promise<VerifiedToken> {
  const { payload } = await jwtVerify(token, toKey(secret));
  if (typeof payload.sub !== 'string') {
    throw new Error('Token is missing a subject');
  }
  return payload as unknown as VerifiedToken;
}