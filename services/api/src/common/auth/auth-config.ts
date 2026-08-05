import { generateSecret } from '@ajac/auth';

export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
}

let cached: AuthConfig | null = null;

function readSecret(envName: string): string {
  const value = process.env[envName];
  if (value) {
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable ${envName}`);
  }
  // Development fallback so the API runs without a .env; changes every boot.
  return generateSecret(48);
}

/** JWT configuration, resolved once from the environment (overridable per test). */
export function getAuthConfig(): AuthConfig {
  if (cached) {
    return cached;
  }
  cached = {
    accessSecret: readSecret('JWT_ACCESS_SECRET'),
    refreshSecret: readSecret('JWT_REFRESH_SECRET'),
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL ?? 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL ?? 2592000),
  };
  return cached;
}
