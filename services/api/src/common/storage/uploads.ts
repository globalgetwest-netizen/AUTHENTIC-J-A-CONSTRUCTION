import { mkdirSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';

/**
 * Self-hosted document storage. Files live under a local `uploads/` directory
 * (overridable via `UPLOADS_DIR`). They are NOT served publicly: the API
 * streams them on demand through the authenticated, permission-gated
 * `GET /documents/:id/file` endpoint (see documents.controller). No external
 * object store: exactly like the rest of this self-hosted stack.
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

/**
 * Resolves a stored `/uploads/...` fileUrl to a path strictly inside
 * UPLOADS_DIR, refusing anything outside it (defense-in-depth against path
 * traversal — stored fileUrls are server-generated, but never trust the seam).
 */
export function resolveStoredFile(fileUrl: string): string {
  if (!fileUrl.startsWith('/uploads/')) {
    throw new BadRequestException('This document is a linked URL, not a stored file');
  }
  const root = resolve(UPLOADS_DIR);
  const abs = resolve(root, fileUrl.slice('/uploads/'.length));
  if (abs !== root && !abs.startsWith(root + sep)) {
    throw new BadRequestException('Invalid stored file path');
  }
  return abs;
}

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
};

/**
 * Extension-derived Content-Type for a stored file. Deliberately not the
 * client-supplied mimetype (which is attacker-influenced); the extension was
 * already allow-listed at upload time via `safeExtension`.
 */
export function contentTypeFromFile(filename: string): string {
  return CONTENT_TYPES[extname(filename).toLowerCase()] ?? 'application/octet-stream';
}