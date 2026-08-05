import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

// Uses Node's built-in scrypt — memory-hard, well-audited, and dependency-free
// (no native compilation on Windows). Stored format:
//   scrypt:<N>:<r>:<p>:<salt-hex>:<hash-hex>
const KEY_LENGTH = 64;
const DEFAULT_COST = 16384; // N
const DEFAULT_BLOCK_SIZE = 8; // r
const DEFAULT_PARALLELIZATION = 1; // p

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

function parseStored(encoded: string): {
  scheme: string;
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  hash: Buffer;
} | null {
  const parts = encoded.split(':');
  if (parts.length !== 6) return null;
  const [scheme, costStr, blockSizeStr, parallelizationStr, saltHex, hashHex] = parts;
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return null;
  const cost = Number(costStr);
  const blockSize = Number(blockSizeStr);
  const parallelization = Number(parallelizationStr);
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelization)) return null;
  return {
    scheme,
    cost,
    blockSize,
    parallelization,
    salt: Buffer.from(saltHex, 'hex'),
    hash: Buffer.from(hashHex, 'hex'),
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: DEFAULT_COST,
    r: DEFAULT_BLOCK_SIZE,
    p: DEFAULT_PARALLELIZATION,
  });
  return [
    'scrypt',
    DEFAULT_COST,
    DEFAULT_BLOCK_SIZE,
    DEFAULT_PARALLELIZATION,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join(':');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parsed = parseStored(encoded);
  if (!parsed) return false;
  const derived = await scrypt(password, parsed.salt, parsed.hash.length, {
    N: parsed.cost,
    r: parsed.blockSize,
    p: parsed.parallelization,
  });
  return derived.length === parsed.hash.length && timingSafeEqual(derived, parsed.hash);
}