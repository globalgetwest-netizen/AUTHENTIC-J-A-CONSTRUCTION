import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagsService } from './feature-flags.service';

type MockFlag = Record<
  'findMany' | 'count' | 'findUnique' | 'create' | 'update' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: FeatureFlagsService; featureFlag: MockFlag } {
  const featureFlag: MockFlag = {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
  const prisma = { featureFlag } as unknown as PrismaService;
  return { service: new FeatureFlagsService(prisma), featureFlag };
}

describe('FeatureFlagsService', () => {
  it('lists flags with search and pagination', async () => {
    const { service, featureFlag } = makeService();
    featureFlag.findMany.mockResolvedValue([{ id: 'f1' }]);
    featureFlag.count.mockResolvedValue(1);

    const result = await service.list({ page: 2, pageSize: 5, search: 'billing' });

    expect(featureFlag.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
    expect(result.meta.total).toBe(1);
    expect(featureFlag.findMany.mock.calls[0]?.[0]?.where.OR).toEqual([
      { key: { contains: 'billing', mode: 'insensitive' } },
      { description: { contains: 'billing', mode: 'insensitive' } },
    ]);
  });

  it('gets a flag by key and throws NotFound otherwise', async () => {
    const { service, featureFlag } = makeService();
    featureFlag.findUnique.mockResolvedValue({ id: 'f1', key: 'billing' });

    await expect(service.getByKey('billing')).resolves.toMatchObject({ key: 'billing' });

    featureFlag.findUnique.mockResolvedValue(null);
    await expect(service.getByKey('nope')).rejects.toThrow(NotFoundException);
  });

  it('creates a flag', async () => {
    const { service, featureFlag } = makeService();
    featureFlag.create.mockResolvedValue({ id: 'f1', key: 'billing', enabled: true });

    const created = await service.create({ key: 'billing', enabled: true });

    expect(featureFlag.create).toHaveBeenCalledWith({ data: { key: 'billing', enabled: true } });
    expect(created.enabled).toBe(true);
  });

  it('ensures a flag exists before updating', async () => {
    const { service, featureFlag } = makeService();
    featureFlag.findUnique.mockResolvedValue(null);

    await expect(service.updateByKey('nope', { enabled: false })).rejects.toThrow(
      NotFoundException,
    );
    expect(featureFlag.update).not.toHaveBeenCalled();
  });

  it('hard-deletes by key and throws NotFound when nothing matched', async () => {
    const { service, featureFlag } = makeService();
    featureFlag.deleteMany.mockResolvedValue({ count: 1 });

    await service.removeByKey('billing');

    expect(featureFlag.deleteMany).toHaveBeenCalledWith({ where: { key: 'billing' } });

    featureFlag.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeByKey('nope')).rejects.toThrow(NotFoundException);
  });
});
