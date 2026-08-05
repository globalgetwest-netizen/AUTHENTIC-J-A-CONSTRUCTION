// Copies the generated Prisma client (JS + d.ts, already emitted by `prisma
// generate`) into `dist/generated/client`, alongside the tsc-compiled wrapper.
//
// Windows locks native engine files (query_engine-*.dll.node) while a process
// has the client loaded, so an unconditional recursive copy fails with EPIPE.
// To stay robust in that case, files that are already present and up to date
// are skipped; only new or changed files are copied. A genuinely changed engine
// still copies (and would require a restart if locked, as with any Prisma
// upgrade on Windows).
'use strict';

/* eslint-disable @typescript-eslint/no-require-imports -- Node CJS build script */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'generated', 'client');
const DEST = path.join(__dirname, '..', 'dist', 'generated', 'client');

function copyIfChanged(src) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    return true;
  }
  const rel = path.relative(SRC, src);
  const dest = path.join(DEST, rel);
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= stat.mtimeMs) {
    return false;
  }
  return true;
}

fs.cpSync(SRC, DEST, { recursive: true, force: true, filter: copyIfChanged });
console.log(`[copy-generated] copied generated client -> ${path.relative(process.cwd(), DEST)}`);
