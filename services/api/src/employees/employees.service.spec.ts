import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from './employees.service';

type MockEmployee = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: EmployeesService;
  employee: MockEmployee;
} {
  const employee: MockEmployee = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { employee } as unknown as PrismaService;
  return { service: new EmployeesService(prisma), employee };
}

describe('EmployeesService', () => {
  it('creates an employee with an auto EMP code and converts the hire date', async () => {
    const { service, employee } = makeService();
    employee.create.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));

    const created = await service.create({
      firstName: 'Ama',
      lastName: 'Owusu',
      email: 'ama@example.com',
      hireDate: '2026-08-01T00:00:00.000Z',
      status: 'ACTIVE',
    });

    expect(created.employeeCode).toMatch(/^EMP-/);
    expect(created.firstName).toBe('Ama');
    expect(created.hireDate).toBeInstanceOf(Date);
    expect(employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hireDate: expect.any(Date) }),
      }),
    );
  });

  it('lists non-deleted employees, applying filters and search', async () => {
    const { service, employee } = makeService();
    employee.findMany.mockResolvedValue([{ id: 'e1' }]);
    employee.count.mockResolvedValue(1);

    const result = await service.list({
      page: 2,
      pageSize: 10,
      status: 'ACTIVE',
      departmentId: 'd1',
      search: 'owusu',
    });

    expect(employee.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    expect(result.data).toEqual([{ id: 'e1' }]);
    expect(result.meta.total).toBe(1);
    const where = employee.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBe('ACTIVE');
    expect(where.departmentId).toBe('d1');
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('throws NotFound for a missing or soft-deleted employee', async () => {
    const { service, employee } = makeService();
    employee.findFirst.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates only the supplied fields', async () => {
    const { service, employee } = makeService();
    employee.findFirst.mockResolvedValue({ id: 'e1' });
    employee.update.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));

    const updated = await service.update('e1', { status: 'ON_LEAVE' });

    expect(updated.status).toBe('ON_LEAVE');
    expect(updated.firstName).toBeUndefined();
    expect(employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ON_LEAVE' }),
      }),
    );
  });

  it('converts an explicit null termination date to a clear', async () => {
    const { service, employee } = makeService();
    employee.findFirst.mockResolvedValue({ id: 'e1' });
    employee.update.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));

    await service.update('e1', { terminationDate: null as unknown as string });

    expect(employee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ terminationDate: null }) }),
    );
  });

  it('soft-deletes instead of hard-deleting', async () => {
    const { service, employee } = makeService();
    employee.updateMany.mockResolvedValue({ count: 1 });
    await service.remove('e1');
    expect(employee.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it('throws NotFound when removing a missing employee', async () => {
    const { service, employee } = makeService();
    employee.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
