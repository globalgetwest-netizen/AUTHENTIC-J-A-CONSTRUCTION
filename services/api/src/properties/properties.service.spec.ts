import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from './properties.service';

type MockCrud = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: PropertiesService; type: MockCrud; property: MockCrud; sale: MockCrud } {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  });
  const type = make();
  const property = make();
  const sale = make();
  const prisma = { propertyType: type, property, propertySale: sale } as unknown as PrismaService;
  return { service: new PropertiesService(prisma), type, property, sale };
}

describe('PropertiesService', () => {
  it('creates property types with an auto PTY code', async () => {
    const { service, type } = makeService();
    type.create.mockImplementation(({ data }) => Promise.resolve({ id: 't1', ...data }));

    const created = await service.createType({ name: 'Residential' });

    expect(created.code).toMatch(/^PTY-/);
    expect(type.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Residential' }) }),
    );
  });

  it('lists properties excluding soft-deleted with status/search filters', async () => {
    const { service, property } = makeService();
    property.findMany.mockResolvedValue([{ id: 'p1' }]);
    property.count.mockResolvedValue(1);

    const result = await service.list({ page: 1, pageSize: 20, status: 'AVAILABLE', search: 'villa' });

    expect(result.data).toEqual([{ id: 'p1' }]);
    expect(result.meta.total).toBe(1);
    const where = property.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBe('AVAILABLE');
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('creates a sale with an auto SALE code and balance = price - deposit', async () => {
    const { service, sale, property } = makeService();
    sale.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));
    sale.findFirst.mockResolvedValue({
      id: 's1',
      propertyId: 'p1',
      saleCode: 'SALE-20260801-1A2B3C',
      balanceAmount: 400000,
    });
    property.updateMany.mockResolvedValue({ count: 1 });

    const created = await service.createSale({
      propertyId: 'p1',
      clientId: 'c1',
      price: 500000,
      depositAmount: 100000,
      saleDate: '2026-08-01T00:00:00.000Z',
    });

    expect(created.saleCode).toMatch(/^SALE-/);
    expect(created.balanceAmount).toBe(400000);
    expect(sale.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ propertyId: 'p1', clientId: 'c1' }) }),
    );
  });

  it('marks the property SOLD when a sale completes', async () => {
    const { service, sale, property } = makeService();
    sale.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));
    sale.findFirst.mockResolvedValue({ id: 's1', propertyId: 'p1' });
    property.updateMany.mockResolvedValue({ count: 1 });

    await service.createSale({
      propertyId: 'p1',
      clientId: 'c1',
      price: 500000,
      status: 'COMPLETED',
      saleDate: '2026-08-01T00:00:00.000Z',
    });

    expect(property.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1', deletedAt: null },
        data: { status: 'SOLD' },
      }),
    );
  });

  it('throws NotFound when getting a missing sale', async () => {
    const { service, sale } = makeService();
    sale.findFirst.mockResolvedValue(null);
    await expect(service.getSale('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a property and throws NotFound when nothing matched', async () => {
    const { service, property } = makeService();
    property.updateMany.mockResolvedValue({ count: 1 });
    await service.remove('p1');
    expect(property.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );

    property.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('hard-deletes a sale via deleteMany', async () => {
    const { service, sale } = makeService();
    sale.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeSale('s1');
    expect(sale.deleteMany).toHaveBeenCalledWith({ where: { id: 's1' } });

    sale.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeSale('missing')).rejects.toThrow(NotFoundException);
  });
});
