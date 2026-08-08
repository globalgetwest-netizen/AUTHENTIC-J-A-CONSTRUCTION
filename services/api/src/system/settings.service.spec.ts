import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from './settings.service';

type MockSetting = Record<
  'findMany' | 'count' | 'findUnique' | 'create' | 'update' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: SettingsService; systemSetting: MockSetting } {
  const systemSetting: MockSetting = {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
  const prisma = { systemSetting } as unknown as PrismaService;
  return { service: new SettingsService(prisma), systemSetting };
}

describe('SettingsService', () => {
  it('lists settings with search and pagination', async () => {
    const { service, systemSetting } = makeService();
    systemSetting.findMany.mockResolvedValue([{ id: 's1' }]);
    systemSetting.count.mockResolvedValue(1);

    const result = await service.list({ page: 1, pageSize: 25, search: 'office' });

    expect(systemSetting.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 25 }));
    expect(result.meta.total).toBe(1);
    expect(systemSetting.findMany.mock.calls[0]?.[0]?.where.OR).toEqual([
      { key: { contains: 'office', mode: 'insensitive' } },
      { description: { contains: 'office', mode: 'insensitive' } },
    ]);
  });

  it('gets a setting by key and throws NotFound otherwise', async () => {
    const { service, systemSetting } = makeService();
    systemSetting.findUnique.mockResolvedValue({ id: 's1', key: 'office.hours' });

    await expect(service.getByKey('office.hours')).resolves.toMatchObject({ key: 'office.hours' });

    systemSetting.findUnique.mockResolvedValue(null);
    await expect(service.getByKey('nope')).rejects.toThrow(NotFoundException);
  });

  it('creates a setting', async () => {
    const { service, systemSetting } = makeService();
    systemSetting.create.mockResolvedValue({ id: 's1', key: 'office.hours', value: '8-17' });

    const created = await service.create({ key: 'office.hours', value: '8-17' });

    expect(systemSetting.create).toHaveBeenCalledWith({
      data: { key: 'office.hours', value: '8-17' },
    });
    expect(created.value).toBe('8-17');
  });

  it('ensures a setting exists before updating', async () => {
    const { service, systemSetting } = makeService();
    systemSetting.findUnique.mockResolvedValue(null);

    await expect(service.updateByKey('nope', { value: 'x' })).rejects.toThrow(NotFoundException);
    expect(systemSetting.update).not.toHaveBeenCalled();
  });

  it('hard-deletes by key and throws NotFound when nothing matched', async () => {
    const { service, systemSetting } = makeService();
    systemSetting.deleteMany.mockResolvedValue({ count: 1 });

    await service.removeByKey('office.hours');

    expect(systemSetting.deleteMany).toHaveBeenCalledWith({ where: { key: 'office.hours' } });

    systemSetting.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeByKey('nope')).rejects.toThrow(NotFoundException);
  });
});
