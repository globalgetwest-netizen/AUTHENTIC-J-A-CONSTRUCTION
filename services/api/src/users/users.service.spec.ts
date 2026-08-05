import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

type Mock = ReturnType<typeof vi.fn>;

interface MockDb {
  user: Record<'findMany' | 'count' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'update' | 'updateMany', Mock>;
  session: Record<'updateMany', Mock>;
  userRole: Record<'createMany' | 'deleteMany', Mock>;
  auditLog: Record<'create', Mock>;
  $transaction: Mock;
}

function makeService(): {
  service: UsersService;
  db: MockDb;
} {
  const user = {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const session = { updateMany: vi.fn() };
  const userRole = { createMany: vi.fn(), deleteMany: vi.fn() };
  const auditLog = { create: vi.fn() };
  const db: MockDb = { user, session, userRole, auditLog, $transaction: vi.fn() };
  db.$transaction = vi.fn(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: MockDb) => unknown)(db);
    }
    return Promise.all(arg as unknown[]);
  });
  const prisma = db as unknown as PrismaService;
  return { service: new UsersService(prisma), db };
}

function userRow(): Record<string, unknown> {
  return {
    id: 'u1',
    email: 'x@y.com',
    firstName: 'Ama',
    lastName: 'Mensah',
    phone: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ role: { id: 'r1', name: 'ADMIN' } }],
  };
}

describe('UsersService', () => {
  it('lists users with search, role, and isActive filters', async () => {
    const { service, db } = makeService();
    db.user.findMany.mockResolvedValue([userRow()]);
    db.user.count.mockResolvedValue(1);

    const result = await service.list({ page: 1, pageSize: 10, search: 'ama', roleId: 'r1', isActive: true });

    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    const where = db.user.findMany.mock.calls[0]?.[0]?.where as {
      deletedAt: null;
      isActive: boolean;
      roles: { some: { roleId: string } };
      OR: unknown[];
    };
    expect(where.deletedAt).toBeNull();
    expect(where.isActive).toBe(true);
    expect(where.roles.some.roleId).toBe('r1');
    expect(where.OR).toHaveLength(3);
    expect(result.data[0]?.roles).toEqual([{ id: 'r1', name: 'ADMIN' }]);
  });

  it('throws NotFound when a user is missing', async () => {
    const { service, db } = makeService();
    db.user.findFirst.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('hashes the password (never stores plaintext) and assigns roles on create', async () => {
    const { service, db } = makeService();
    db.user.create.mockResolvedValue({ id: 'u1' });
    db.userRole.createMany.mockResolvedValue({ count: 2 });
    db.user.findFirstOrThrow.mockResolvedValue(userRow());

    const result = await service.create(
      { email: 'x@y.com', password: 'Password123', firstName: 'Ama', lastName: 'Mensah', roleIds: ['r1', 'r2'] },
      {},
    );

    const createCall = db.user.create.mock.calls[0]?.[0] as {
      data: { passwordHash: string; password?: string };
    };
    expect(createCall.data.passwordHash).not.toBe('Password123');
    expect(createCall.data.password).toBeUndefined();
    expect(db.userRole.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([{ userId: 'u1', roleId: 'r1' }]),
    });
    expect(result.roles).toEqual([{ id: 'r1', name: 'ADMIN' }]);
  });

  it('skips role assignment when no roleIds are supplied', async () => {
    const { service, db } = makeService();
    db.user.create.mockResolvedValue({ id: 'u1' });
    db.user.findFirstOrThrow.mockResolvedValue(userRow());

    await service.create({ email: 'x@y.com', password: 'Password123', firstName: 'Ama', lastName: 'Mensah' }, {});
    expect(db.userRole.createMany).not.toHaveBeenCalled();
  });

  it('replaces roles and revokes sessions when an admin resets a password on update', async () => {
    const { service, db } = makeService();
    db.user.findFirst.mockResolvedValue({ id: 'u1' });
    db.userRole.deleteMany.mockResolvedValue({ count: 1 });
    db.userRole.createMany.mockResolvedValue({ count: 1 });
    db.session.updateMany.mockResolvedValue({ count: 1 });
    db.user.update.mockResolvedValue({});
    db.user.findFirstOrThrow.mockResolvedValue(userRow());

    await service.update('u1', { password: 'NewPass1', roleIds: ['r2'] }, {});

    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(db.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u1', roleId: 'r2' }],
    });
    const updateCall = db.user.update.mock.calls[0]?.[0] as { data: { passwordHash: string } };
    expect(updateCall.data.passwordHash).not.toBe('NewPass1');
  });

  it('throws NotFound when updating a missing user', async () => {
    const { service, db } = makeService();
    db.user.findFirst.mockResolvedValue(null);
    await expect(service.update('missing', { firstName: 'X' }, {})).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a user and revokes their sessions on remove', async () => {
    const { service, db } = makeService();
    db.user.updateMany.mockResolvedValue({ count: 1 });
    db.session.updateMany.mockResolvedValue({ count: 1 });

    await service.remove('u2', 'u1', {});

    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u2', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('prevents an admin from deleting their own account', async () => {
    const { service } = makeService();
    await expect(service.remove('u1', 'u1', {})).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when removing a missing user', async () => {
    const { service, db } = makeService();
    db.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing', 'u1', {})).rejects.toThrow(NotFoundException);
  });
});
