import { describe, expect, it } from 'vitest';
import { join, resolve } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { contentTypeFromFile, resolveStoredFile, UPLOADS_DIR } from './uploads';

const ROOT = resolve(UPLOADS_DIR);

describe('resolveStoredFile', () => {
  it('resolves a stored /uploads path to a path inside the uploads dir', () => {
    expect(resolveStoredFile('/uploads/documents/abc123.pdf')).toBe(
      join(ROOT, 'documents', 'abc123.pdf'),
    );
  });

  it('rejects a fileUrl that is not under /uploads', () => {
    expect(() => resolveStoredFile('https://evil.example/x.pdf')).toThrow(BadRequestException);
    expect(() => resolveStoredFile('/etc/passwd')).toThrow(BadRequestException);
    expect(() => resolveStoredFile('uploads/documents/x.pdf')).toThrow(BadRequestException);
  });

  it('rejects traversal that escapes the uploads dir', () => {
    // ../../ climbs above UPLOADS_DIR no matter how many levels exist.
    expect(() => resolveStoredFile('/uploads/../../etc/passwd')).toThrow(BadRequestException);
  });

  it('allows traversal that collapses back inside the uploads dir', () => {
    // Normalizes to a real path inside UPLOADS_DIR — harmless.
    expect(resolveStoredFile('/uploads/documents/../secrets.txt')).toBe(
      join(ROOT, 'secrets.txt'),
    );
  });
});

describe('contentTypeFromFile', () => {
  it('maps allow-listed extensions to real Content-Types', () => {
    expect(contentTypeFromFile('signed.pdf')).toBe('application/pdf');
    expect(contentTypeFromFile('report.DOCX')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('falls back to octet-stream for unknown extensions', () => {
    expect(contentTypeFromFile('notes.bin')).toBe('application/octet-stream');
    expect(contentTypeFromFile('noext')).toBe('application/octet-stream');
  });

  it('never trusts a path separator for the extension lookup', () => {
    // `.pdf` in a directory name must not be treated as the file extension.
    expect(contentTypeFromFile('pdf/scan.pdf')).toBe('application/pdf');
  });
});
