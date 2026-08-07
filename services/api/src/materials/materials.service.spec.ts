import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { MaterialsService } from './materials.service';

type MockCrud = Record<
  'findFirst' | 'findUnique' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: MaterialsService;
  category: MockCrud;
  material: MockCrud;
  warehouse: MockCrud;
  inventory: MockCrud;
  transaction: MockCrud;
  movement: MockCrud;
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
  const category = make();
  const material = make();
  const warehouse = make();
  const inventory = make();
  const transaction = make();
  const movement = make();
  const prisma = {
    materialCategory: category,
    material,
    warehouse,
    inventory,
    inventoryTransaction: transaction,
    stockMovement: movement,
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  } as unknown as PrismaService;
  return { service: new MaterialsService(prisma), category, material, warehouse, inventory, transaction, movement };
}

describe('MaterialsService', () => {
  it('creates categories with an auto CAT code', async () => {
    const { service, category } = makeService();
    category.create.mockImplementation(({ data }) => Promise.resolve({ id: 'c1', ...data }));

    const created = await service.createCategory({ name: 'Cement & Binders' });

    expect(created.code).toMatch(/^CAT-/);
  });

  it('lists materials excluding soft-deleted with search', async () => {
    const { service, material } = makeService();
    material.findMany.mockResolvedValue([{ id: 'm1' }]);
    material.count.mockResolvedValue(1);

    const result = await service.listMaterials({ page: 1, pageSize: 20, search: 'cement' });

    expect(result.data).toEqual([{ id: 'm1' }]);
    expect(result.meta.total).toBe(1);
    const where = material.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('creates materials with an auto MAT sku', async () => {
    const { service, material } = makeService();
    material.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm1', ...data }));

    const created = await service.createMaterial({ categoryId: 'c1', name: 'Cement', unit: 'bag' });

    expect(created.sku).toMatch(/^MAT-/);
    expect(material.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoryId: 'c1', name: 'Cement' }) }),
    );
  });

  it('soft-deletes a material and hard-deletes a category', async () => {
    const { service, material, category } = makeService();
    material.updateMany.mockResolvedValue({ count: 1 });
    await service.removeMaterial('m1');
    expect(material.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1', deletedAt: null } }),
    );

    category.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeCategory('c1');
    expect(category.deleteMany).toHaveBeenCalledWith({ where: { id: 'c1' } });

    category.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeCategory('missing')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when getting a missing material', async () => {
    const { service, material } = makeService();
    material.findFirst.mockResolvedValue(null);
    await expect(service.getMaterial('missing')).rejects.toThrow(NotFoundException);
  });

  it('receiveStock increments inventory and writes an IN transaction', async () => {
    const { service, inventory, transaction } = makeService();
    inventory.findUnique
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(10) })
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(10) });
    inventory.update.mockImplementation(({ data }) => Promise.resolve({ id: 'i1', quantity: data.quantity }));
    transaction.create.mockResolvedValue({ id: 't1' });

    const result = await service.receiveStock({ materialId: 'm1', warehouseId: 'w1', quantity: 5 }, 'u1');

    expect(result.quantity.toNumber()).toBe(15);
    expect(transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'IN',
          materialId: 'm1',
          warehouseId: 'w1',
          quantity: 5,
          createdById: 'u1',
        }),
      }),
    );
  });

  it('issueStock throws on insufficient stock', async () => {
    const { service, inventory } = makeService();
    inventory.findUnique.mockResolvedValue({ id: 'i1', quantity: new Prisma.Decimal(3) });

    await expect(
      service.issueStock({ materialId: 'm1', warehouseId: 'w1', quantity: 10 }, 'u1'),
    ).rejects.toThrow(BadRequestException);
    expect(inventory.update).not.toHaveBeenCalled();
  });

  it('issueStock decrements stock when sufficient', async () => {
    const { service, inventory } = makeService();
    inventory.findUnique
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(10) })
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(10) });
    inventory.update.mockImplementation(({ data }) => Promise.resolve({ id: 'i1', quantity: data.quantity }));

    const result = await service.issueStock({ materialId: 'm1', warehouseId: 'w1', quantity: 4 }, 'u1');

    expect(result.quantity.toNumber()).toBe(6);
  });

  it('adjustStock sets inventory to the counted value', async () => {
    const { service, inventory } = makeService();
    inventory.findUnique.mockResolvedValueOnce({ id: 'i1' });
    inventory.update.mockImplementation(({ data }) => Promise.resolve({ id: 'i1', quantity: data.quantity }));

    const result = await service.adjustStock({ materialId: 'm1', warehouseId: 'w1', quantity: 0 }, 'u1');

    expect(result.quantity.toNumber()).toBe(0);
  });

  it('transferStock moves stock and records a StockMovement', async () => {
    const { service, inventory, transaction, movement } = makeService();
    inventory.findUnique
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(20) })
      .mockResolvedValueOnce({ id: 'i1', quantity: new Prisma.Decimal(20) })
      .mockResolvedValueOnce(null);
    inventory.update.mockImplementation(({ data }) => Promise.resolve({ id: 'i1', quantity: data.quantity }));
    inventory.create.mockImplementation(({ data }) => Promise.resolve({ id: 'i2', quantity: data.quantity }));
    transaction.create.mockResolvedValue({ id: 't1' });
    movement.create.mockResolvedValue({ id: 'sm1' });

    const result = await service.transferStock(
      { materialId: 'm1', fromWarehouseId: 'w1', toWarehouseId: 'w2', quantity: 5 },
      'u1',
    );

    expect(result.quantity.toNumber()).toBe(5);
    expect(movement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inventoryId: 'i2',
          transactionId: 't1',
          fromWarehouseId: 'w1',
          toWarehouseId: 'w2',
          quantity: 5,
        }),
      }),
    );
  });
});
