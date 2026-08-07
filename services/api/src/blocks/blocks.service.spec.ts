import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from './blocks.service';

type MockCrud = Record<
  'findFirst' | 'findUnique' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: BlocksService;
  product: MockCrud;
  production: MockCrud;
  sale: MockCrud;
} {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  });
  const product = make();
  const production = make();
  const sale = make();
  const prisma = {
    blockProduct: product,
    blockProduction: production,
    blockSale: sale,
  } as unknown as PrismaService;
  return { service: new BlocksService(prisma), product, production, sale };
}

describe('BlocksService', () => {
  it('creates block products with an auto BLC code', async () => {
    const { service, product } = makeService();
    product.create.mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data }));

    const created = await service.createProduct({ name: '6-inch block', unitPrice: 12.5 });

    expect(created.code).toMatch(/^BLC-/);
  });

  it('lists products excluding soft-deleted with search', async () => {
    const { service, product } = makeService();
    product.findMany.mockResolvedValue([{ id: 'p1' }]);
    product.count.mockResolvedValue(1);

    const result = await service.listProducts({ page: 1, pageSize: 20, search: 'block' });

    expect(result.data).toEqual([{ id: 'p1' }]);
    const where = product.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('soft-deletes a product and hard-deletes a production', async () => {
    const { service, product, production } = makeService();
    product.updateMany.mockResolvedValue({ count: 1 });
    await service.removeProduct('p1');
    expect(product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', deletedAt: null } }),
    );

    production.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeProduction('pr1');
    expect(production.deleteMany).toHaveBeenCalledWith({ where: { id: 'pr1' } });

    production.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeProduction('missing')).rejects.toThrow(NotFoundException);
  });

  it('creates a production with an auto PRD batch no and COMPLETED status', async () => {
    const { service, product, production } = makeService();
    product.findFirst.mockResolvedValue({ id: 'p1' });
    production.create.mockImplementation(({ data }) => Promise.resolve({ id: 'pr1', ...data }));

    const created = await service.createProduction({ productId: 'p1', quantity: 500 });

    expect(created.batchNo).toMatch(/^PRD-/);
    expect(created.status).toBe('COMPLETED');
    expect(production.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ quantity: 500, productId: 'p1' }) }),
    );
  });

  it('throws NotFound when creating a production for a missing product', async () => {
    const { service, product } = makeService();
    product.findFirst.mockResolvedValue(null);
    await expect(service.createProduction({ productId: 'p1', quantity: 10 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('computes sale totalAmount from the product unit price when omitted', async () => {
    const { service, product, sale } = makeService();
    product.findFirst.mockResolvedValue({ unitPrice: new Prisma.Decimal(12.5) });
    sale.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));

    const created = await service.createSale({ productId: 'p1', quantity: 100, soldOn: '2026-08-07' });

    expect(created.unitPrice).toBe(12.5);
    expect(created.totalAmount.toNumber()).toBe(1250);
  });

  it('uses the provided unit price for a sale', async () => {
    const { service, product, sale } = makeService();
    product.findFirst.mockResolvedValue({ unitPrice: new Prisma.Decimal(12.5) });
    sale.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));

    const created = await service.createSale({
      productId: 'p1',
      quantity: 10,
      unitPrice: 14,
      soldOn: '2026-08-07',
    });

    expect(created.totalAmount.toNumber()).toBe(140);
  });

  it('recomputes totalAmount on sale update when quantity changes', async () => {
    const { service, sale } = makeService();
    sale.findFirst.mockResolvedValue({ id: 's1', productId: 'p1', quantity: 10, unitPrice: new Prisma.Decimal(12.5) });
    sale.update.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));

    const updated = await service.updateSale('s1', { quantity: 20 });

    expect(updated.totalAmount.toNumber()).toBe(250);
  });
});
