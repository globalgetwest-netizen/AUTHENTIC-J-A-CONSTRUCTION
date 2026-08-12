/**
 * Local production password reset — run from your Windows machine.
 *
 * Usage (PowerShell, from repo root):
 *   $env:RESET_DB_URL = "postgresql://USER:PASS@HOST:5432/DBNAME?sslmode=require"
 *   $env:RESET_EMAIL   = "admin@authenticja.com"
 *   $env:RESET_PW      = "Admin123"
 *   node --import tsx scripts/reset-admin-password.ts
 *
 * Why this exists: Render's free plan has no Shell, and the deploy-time seed
 * keeps hitting E57P01 (DB connection dropped mid-seed) so it never writes the
 * password. This connects directly to the production DB and sets the hash,
 * mimicking exactly what the API's own hashPassword() produces
 * (scrypt:16384:8:1:<salt>:<hash>).
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createPrismaClient } from '@ajac/database';

const scrypt = promisify(scryptCb) as (
  p: string,
  salt: Buffer,
  k: number,
  o: { N: number; r: number; p: number },
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return ['scrypt', 16384, 8, 1, salt.toString('hex'), derived.toString('hex')].join(':');
}

async function main() {
  const url = process.env.RESET_DB_URL;
  const email = (process.env.RESET_EMAIL ?? 'admin@authenticja.com').toLowerCase();
  const pw = process.env.RESET_PW ?? 'Admin123';
  if (!url) {
    console.error('SET RESET_DB_URL to the production DATABASE_URL (from Render DB page).');
    process.exit(1);
  }
  const prisma = createPrismaClient({ url, log: ['error'] });
  const hash = await hashPassword(pw);
  const user = await prisma.user.updateMany({
    where: { email },
    data: { passwordHash: hash, isActive: true, deletedAt: null },
  });
  console.log(`Updated ${user.count} user(s) for ${email} with the new password.`);
  if (user.count === 0) {
    console.log('No user with that email — check RESET_EMAIL. Seed may not have created it yet.');
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
