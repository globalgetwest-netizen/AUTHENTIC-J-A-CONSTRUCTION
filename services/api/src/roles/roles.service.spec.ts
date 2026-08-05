import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { RolesService } from './roles.service';

type Mock = ReturnType<typeof vi.fn>;

interface MockDb {
  role: Record<'findMany' | 'findUnique' | 'create' | 'update' | 'findFirstOrThrow' | 'deleteMany', Mock>;
  permission: Record<'findMany', Mock>;
  rolePermission: Record<'createMany' | 'deleteMany', Mock>;
  userRole: Record<'count', Mock>;
  auditLog: Record<'create', Mock>;
  $transaction: Mock;
}

function makeService(): {
  service: RolesService;
  db: MockDb;
} {
  const role = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findFirstOrThrow: vi.fn(),
    deleteMany: vi.fn(),
  };
  const permission = { findMany: vi.fn() };
  const rolePermission = { createMany: vi.fn(), deleteMany: vi.fn() };
  const userRole = { count: vi.fn() };
  const auditLog = { create: vi.fn() };
  const db: MockDb = { role, permission, rolePermission, userRole, auditLog, $transaction: vi.fn() };
  db.$transaction = vi.fn(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: MockDb) => unknown)(db);
    }
    return Promise.all(arg as unknown[]);
  });
  const prisma = db as unknown as PrismaService;
  return { service: new RolesService(prisma), db };
}

function roleRow(): Record<string, unknown> {
  return {
    id: 'r1',
    name: 'SUPER_ADMIN',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [{ permission: { code: 'users.read' } }, { permission: { code: 'roles.write' } }],
    _count: { users: 2 },
  };
}

describe('RolesService', () => {
  it('lists roles with flattened permissions and user counts', async () => {
    const { service, db } = makeService();
    db.role.findMany.mockResolvedValue([roleRow()]);

    const result = await service.list();

    expect(db.role.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    );
    expect(result[0]?.permissions).toEqual(['users.read', 'roles.write']);
    expect(result[0]?.userCount).toBe(2);
  });

  it('throws NotFound for a missing role', async () => {
    const { service, db } = makeService();
    db.role.findUnique.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('validates permission codes before creating a role', async () => {
    const { service, db } = makeService();
    db.role.create.mockResolvedValue({ id: 'r1' });
    db.permission.findMany.mockResolvedValue([{ id: 'p1' }]);
    db.rolePermission.createMany.mockResolvedValue({ count: 1 });
    db.role.findFirstOrThrow.mockResolvedValue(roleRow());

    await service.create({ name: 'VIEWER', permissionCodes: ['users.read'] }, {});

    expect(db.rolePermission.createMany).toHaveBeenCalledWith({
      data: [{ roleId: 'r1', permissionId: 'p1' }],
    });
  });

  it('rejects creation when a permission code does not exist', async () => {
    const { service, db } = makeService();
    db.role.create.mockResolvedValue({ id: 'r1' });
    db.permission.findMany.mockResolvedValue([{ id: 'p1' }]);

    await expect(
      service.create({ name: 'VIEWER', permissionCodes: ['users.read', 'ghost.write'] }, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects updates referencing unknown permission codes', async () => {
    const { service, db } = makeService();
    db.role.findUnique.mockResolvedValue({ id: 'r1' });
    db.permission.findMany.mockResolvedValue([]);

    await expect(
      service.update('r1', { permissionCodes: ['ghost.write'] }, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses to delete a role assigned to users', async () => {
    const { service, db } = makeService();
    db.userRole.count.mockResolvedValue(3);

    await expect(service.remove('r1', {})).rejects.toThrow(ConflictException);
  });

  it('throws NotFound when removing a missing role', async () => {
    const { service, db } = makeService();
    db.userRole.count.mockResolvedValue(0);
    db.role.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.remove('missing', {})).rejects.toThrow(NotFoundException);
  });
});
