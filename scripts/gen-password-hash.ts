import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  p: string,
  salt: Buffer,
  k: number,
  o: { N: number; r: number; p: number },
) => Promise<Buffer>;

async function main() {
  const pw = process.argv[2] ?? 'Admin123';
  const salt = randomBytes(16);
  const derived = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  const hash = ['scrypt', 16384, 8, 1, salt.toString('hex'), derived.toString('hex')].join(':');
  console.log(hash);
}

main();
