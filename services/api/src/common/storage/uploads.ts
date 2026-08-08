import { mkdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

/**
 * Self-hosted document storage. Files go into a local `uploads/` directory
 * (overridable via `UPLOADS_DIR`) that the API serves statically at
 * `/uploads/...` (see app.factory). No external object store: exactly like the
 * rest of this self-hosted stack.
 */
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads'));

/** Absolute path of the sub-directory holding one entity type's files. */
export function uploadsSubDir(...segments: string[]): string {
  const dir = join(UPLOADS_DIR, ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** The `/uploads/...` URL a stored file is reachable at. */
export function uploadsUrl(...segments: string[]): string {
  return `/uploads/${segments.map((s) => s.replace(/\\/g, '/')).join('/')}`;
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.md',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip',
]);

/** Guarded file extension (lowercased, dot-prefixed, allow-listed). */
export function safeExtension(filename: string): string {
  const ext = extname(filename).toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(
      `Unsupported file type "${ext || filename}". Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
    );
  }
  return ext;
}

/**
 * Disk-storage options for a multer interceptor writing to the documents
 * uploads sub-directory. A unique filename ("<uuid><ext>") prevents collisions
 * and path traversal — the stored name is never derived from the client's
 * original basename.
 */
export function documentsDiskStorage(): MulterOptions['storage'] {
  const dir = uploadsSubDir('documents');
  return diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      try {
        cb(null, `${randomUUID()}${safeExtension(file.originalname)}`);
      } catch (error) {
        cb(error as Error, '');
      }
    },
  });
}

/** Guarantees the uploads tree exists before anything is written to it. */
export function ensureUploadsDir(): void {
  uploadsSubDir('documents');
}