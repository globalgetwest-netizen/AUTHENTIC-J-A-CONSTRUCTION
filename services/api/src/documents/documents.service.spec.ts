import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccessLevel, DocumentStatus } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/auth/auth-user.type';
import { DocumentsService } from './documents.service';

type MockCrud = Record<
  'findMany' | 'findFirst' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany' | 'upsert',
  ReturnType<typeof vi.fn>
>;

const USER: AuthUser = {
  id: 'u1',
  email: 'admin@authenticja.com',
  firstName: 'System',
  lastName: 'Admin',
  isActive: true,
  roles: ['SUPER_ADMIN'],
  permissions: ['documents.read', 'documents.write'],
};

const FILE = {
  fieldname: 'file',
  originalname: 'signed-contract.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 4096,
  destination: 'uploads/documents',
  filename: 'abc123.pdf',
  path: 'uploads/documents/abc123.pdf',
} as Express.Multer.File;

function makeService(): {
  service: DocumentsService;
  document: MockCrud;
  documentVersion: MockCrud;
  documentAccess: MockCrud;
  user: MockCrud;
} {
  const make = (): MockCrud => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  });
  const document = make();
  const documentVersion = make();
  const documentAccess = make();
  const user = make();
  const prisma = {
    document,
    documentVersion,
    documentAccess,
    user,
    $transaction: vi.fn((arg: unknown) =>
      Array.isArray(arg)
        ? Promise.all(arg as Promise<unknown>[])
        : typeof arg === 'function'
          ? arg(prisma)
          : Promise.resolve(arg),
    ),
  } as unknown as PrismaService;
  return { service: new DocumentsService(prisma), document, documentVersion, documentAccess, user };
}

const doc = (over: Record<string, unknown> = {}) => ({
  id: 'd1',
  title: 'Signed contract',
  category: 'contracts',
  fileUrl: '/uploads/documents/abc123.pdf',
  fileType: 'application/pdf',
  sizeBytes: 1234,
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
  _count: { versions: 1 },
  ...over,
});

/** user.findMany serves the uploader-name enrichment. */
function mockUploaders(user: MockCrud) {
  user.findMany.mockImplementation(({ where }: { where: { id: { in: string[] } } }) => {
    const found = where.id.in.map((id) => ({
      id,
      firstName: id === 'u1' ? 'System' : 'Ama',
      lastName: id === 'u1' ? 'Admin' : 'Owusu',
    }));
    return Promise.resolve(found);
  });
}

describe('DocumentsService', () => {
  it('lists documents scoped to live rows, searching the title', async () => {
    const { service, document, user } = makeService();
    document.findMany.mockResolvedValue([doc()]);
    document.count.mockResolvedValue(1);
    mockUploaders(user);

    const res = await service.list({ search: 'contract' });

    expect(document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, title: { contains: 'contract', mode: 'insensitive' } },
      }),
    );
    expect(res.meta.total).toBe(1);
    expect(res.data[0]).toMatchObject({ title: 'Signed contract', uploaderName: 'System Admin' });
  });

  it('filters the list by status and category', async () => {
    const { service, document, user } = makeService();
    document.findMany.mockResolvedValue([]);
    document.count.mockResolvedValue(0);

    await service.list({ status: DocumentStatus.FINAL, category: 'contracts' });

    expect(document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, status: DocumentStatus.FINAL, category: 'contracts' },
      }),
    );
    expect(user.findMany).not.toHaveBeenCalled();
  });

  it('gets a document with versions, access and the uploader name', async () => {
    const { service, document, user } = makeService();
    document.findFirst.mockResolvedValue(doc({ versions: [{ version: 1 }], access: [] }));
    mockUploaders(user);

    const res = await service.get('d1');

    expect(res.id).toBe('d1');
    expect(res.uploaderName).toBe('System Admin');
    expect(document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd1', deletedAt: null } }),
    );
  });

  it('get throws 404 for a missing or deleted document', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue(null);

    await expect(service.get('d1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a DRAFT with version 1 from an uploaded file', async () => {
    const { service, document, user } = makeService();
    document.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'd2', ...data, versions: [], access: [], _count: { versions: 1 } }),
    );
    mockUploaders(user);

    const res = await service.create({ title: 'Contract' }, USER, FILE);

    expect(res.id).toBe('d2');
    expect(document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Contract',
          status: DocumentStatus.DRAFT,
          uploadedById: 'u1',
          fileUrl: '/uploads/documents/abc123.pdf',
          versions: {
            create: expect.objectContaining({ version: 1, uploadedById: 'u1' }),
          },
        }),
      }),
    );
  });

  it('rejects a document with neither a file nor a URL', async () => {
    const { service, document } = makeService();

    await expect(service.create({ title: 'Empty' }, USER, undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(document.create).not.toHaveBeenCalled();
  });

  it('adds the next numeric version and repoints the document file', async () => {
    const { service, document, documentVersion, user } = makeService();
    document.findFirst
      .mockResolvedValueOnce({ ...doc(), versions: [{ version: 1 }] })
      .mockResolvedValueOnce(doc({ versions: [{ version: 1 }, { version: 2 }] }));
    document.update.mockResolvedValue({});
    documentVersion.create.mockImplementation(({ data }) => Promise.resolve({ id: 'v2', ...data }));
    mockUploaders(user);

    const res = await service.addVersion('d1', { note: 'Revised' }, USER, FILE);

    expect(documentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2, note: 'Revised', uploadedById: 'u1' }),
      }),
    );
    expect(document.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd1' } }),
    );
    expect(res).toMatchObject({ id: 'd1' });
  });

  it('throws 404 when adding a version to a missing document', async () => {
    const { service, document } = makeService();
    document.findFirst.mockResolvedValue(null);

    await expect(service.addVersion('d1', {}, USER, FILE)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the status', async () => {
    const { service, document, user } = makeService();
    document.findFirst.mockResolvedValueOnce(doc()).mockResolvedValueOnce(doc());
    document.update.mockResolvedValue({});
    mockUploaders(user);

    await service.updateStatus('d1', { status: DocumentStatus.FINAL });

    expect(document.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd1' }, data: { status: DocumentStatus.FINAL } }),
    );
  });

  it('upserts access grants', async () => {
    const { service, document, documentAccess } = makeService();
    document.findFirst.mockResolvedValue(doc());
    documentAccess.upsert.mockImplementation(({ create }: { create: Record<string, unknown> }) =>
      Promise.resolve(create),
    );

    await service.grantAccess('d1', { principalType: 'CLIENT', principalId: 'c1' }, USER);

    expect(documentAccess.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          documentId: 'd1',
          principalType: 'CLIENT',
          principalId: 'c1',
          permission: 'VIEW',
          grantedById: 'u1',
        }),
      }),
    );
  });

  it('revokes an access grant idempotently', async () => {
    const { service, document, documentAccess } = makeService();
    document.findFirst.mockResolvedValue(doc());
    documentAccess.deleteMany.mockResolvedValue({ count: 1 });

    const res = await service.revokeAccess('d1', 'CLIENT', 'c1');

    expect(res).toEqual({ revoked: 1 });
    expect(documentAccess.deleteMany).toHaveBeenCalledWith({
      where: { documentId: 'd1', principalType: 'CLIENT', principalId: 'c1' },
    });
  });

  it('soft-deletes a document', async () => {
    const { service, document } = makeService();
    document.updateMany.mockResolvedValue({ count: 1 });

    const res = await service.remove('d1');

    expect(res).toEqual({ deleted: true });
    expect(document.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd1', deletedAt: null } }),
    );
  });
});