import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { OrgService } from './org.service';

type MockCrud = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: OrgService; company: ReturnType<typeof vi.fn>; branch: MockCrud; department: MockCrud; position: MockCrud } {
  const company = vi.fn();
  const branch: MockCrud = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const department: MockCrud = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const position: MockCrud = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { company: { findFirst: company }, companyBranch: branch, department, position } as unknown as PrismaService;
  return { service: new OrgService(prisma), company, branch, department, position };
}

describe('OrgService', () => {
  it('scopes created branches to the default company with an auto BR code', async () => {
    const { service, company, branch } = makeService();
    company.mockResolvedValue({ id: 'c1' });
    branch.create.mockImplementation(({ data }) => Promise.resolve({ id: 'b1', ...data }));

    const created = await service.createBranch({ name: 'Kumasi' });

    expect(created.code).toMatch(/^BR-/);
    expect(created.companyId).toBe('c1');
    expect(branch.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ companyId: 'c1', name: 'Kumasi' }) }),
    );
  });

  it('lists departments scoped to the company with search', async () => {
    const { service, company, department } = makeService();
    company.mockResolvedValue({ id: 'c1' });
    department.findMany.mockResolvedValue([{ id: 'd1' }]);
    department.count.mockResolvedValue(1);

    const result = await service.listDepartments({ page: 1, pageSize: 20, search: 'works' });

    expect(result.data).toEqual([{ id: 'd1' }]);
    expect(result.meta.total).toBe(1);
    const where = department.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.companyId).toBe('c1');
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('creates positions with an auto POS code and level', async () => {
    const { service, company, position } = makeService();
    company.mockResolvedValue({ id: 'c1' });
    position.create.mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data }));

    const created = await service.createPosition({ title: 'Site Engineer', level: 3 });

    expect(created.code).toMatch(/^POS-/);
    expect(created.title).toBe('Site Engineer');
    expect(created.level).toBe(3);
  });

  it('throws NotFound when getting a missing branch', async () => {
    const { service, branch } = makeService();
    branch.findFirst.mockResolvedValue(null);
    await expect(service.getBranch('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a department and throws NotFound when nothing matched', async () => {
    const { service, department } = makeService();
    department.updateMany.mockResolvedValue({ count: 1 });
    await service.removeDepartment('d1');
    expect(department.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );

    department.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.removeDepartment('missing')).rejects.toThrow(NotFoundException);
  });
});
