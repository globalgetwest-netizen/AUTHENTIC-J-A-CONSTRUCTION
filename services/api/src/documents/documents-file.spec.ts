import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccessLevel, DocumentStatus } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from './documents.service';

// The service streams from disk in openFile(); replace the fs primitives so
// no real files are needed. vi.mock is hoisted above the imports above.
vi.mock('node:fs', () => ({
  createReadStream: vi.fn(),
}));
vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
}));

const mockStat = vi.mocked(stat);
const mockCreateReadStream = vi.mocked(createReadStream);

const DOC = {
  id: 'd1',
  title: 'Signed "final" contract',
  category: 'contracts',
  fileUrl: '/uploads/documents/abc123.pdf',
  fileType: 'application/pdf',
  sizeBytes: 4096,
  uploadedById: 'u1',
  entity: null,
  entityId: null,
  accessLevel: AccessLevel.INTERNAL,
  status: DocumentStatus.DRAFT,
  createdAt: new Date('2026-08-01'),
  updatedAt: new Date('2026-08-01'),
  deletedAt: null,
  versions: [],
  access: [],
};

function makeService(): { service: DocumentsService; document: { findFirst: ReturnType<typeof vi.fn> } } {
  const document = { findFirst: vi.fn() };
  const prisma = { document } as unknown as PrismaService;
  return { service: new DocumentsService(prisma), document };
}

describe('DocumentsService.openFile', () => {
  beforeEach(() => {
    mockStat.mockClear();
    mockCreateReadStream.mockClear();
  });

  it('streams a stored file with a sanitized name and derived type', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue(DOC);
    mockStat.mockResolvedValue({ isFile: () => true, size: 4096 } as never);
    const fakeStream = { pipe: vi.fn() };
    mockCreateReadStream.mockReturnValue(fakeStream as never);

    const res = await service.openFile('d1');

    expect(res.filename).toBe('Signed final contract.pdf');
    expect(res.type).toBe('application/pdf');
    expect(res.length).toBe(4096);
    expect(res.stream).toBe(fakeStream);
    expect(mockStat).toHaveBeenCalledWith(expect.stringContaining('abc123.pdf'));
    expect(mockCreateReadStream).toHaveBeenCalledWith(expect.stringContaining('abc123.pdf'));
  });

  it('throws 404 for a missing or deleted document', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue(null);

    await expect(service.openFile('d1')).rejects.toBeInstanceOf(NotFoundException);
    expect(mockStat).not.toHaveBeenCalled();
  });

  it('rejects a linked-URL document (no stored file)', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue({ ...DOC, fileUrl: 'https://example.com/a.pdf' });

    await expect(service.openFile('d1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockStat).not.toHaveBeenCalled();
  });

  it('rejects a fileUrl that would escape the uploads dir', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue({ ...DOC, fileUrl: '/uploads/../../etc/passwd' });

    await expect(service.openFile('d1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockStat).not.toHaveBeenCalled();
  });

  it('throws 404 when the stored file has disappeared', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue(DOC);
    mockStat.mockRejectedValue(new Error('ENOENT'));

    await expect(service.openFile('d1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
