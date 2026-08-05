import { createHash, randomBytes } from 'node:crypto';
import { signToken } from '@ajac/auth';
import type { AuthConfig } from '../common/auth/auth-config';

export interface AccessTokenPrincipal {
  id: string;
  roles: string[];
  permissions: string[];
}

export function signAccessToken(
  config: AuthConfig,
  principal: AccessTokenPrincipal,
): Promise<string> {
  return signToken(config.accessSecret, principal.id, {
    roles: principal.roles,
    permissions: principal.permissions,
  }, config.accessTtlSeconds);
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** Only the digest is ever stored, so a leaked DB dump cannot be replayed. */
export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
