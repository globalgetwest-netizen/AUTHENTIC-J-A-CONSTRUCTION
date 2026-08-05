import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';

type MockClient = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: ClientsService;
  client: MockClient;
} {
  const client: MockClient = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { client } as unknown as PrismaService;
  return { service: new ClientsService(prisma), client };
}

describe('ClientsService', () => {
  it('lists non-deleted clients, applying filters and pagination', async () => {
    const { service, client } = makeService();
    client.findMany.mockResolvedValue([{ id: 'c1' }]);
    client.count.mockResolvedValue(1);

    const result = await service.list({
      page: 2,
      pageSize: 10,
      status: 'ACTIVE',
      search: 'akwa',
    });

    expect(client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.data).toEqual([{ id: 'c1' }]);
    expect(result.meta.total).toBe(1);
    const where = client.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBe('ACTIVE');
  });

  it('excludes soft-deleted records from get()', async () => {
    const { service, client } = makeService();
    client.findFirst.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('auto-generates a clientCode when none is supplied', async () => {
    const { service, client } = makeService();
    client.create.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'c1' }));
    const created = await service.create({ contactName: 'Ama Mensah' });
    expect(created.clientCode).toMatch(/^CLI-/);
  });

  it('soft-deletes instead of hard-deleting', async () => {
    const { service, client } = makeService();
    client.updateMany.mockResolvedValue({ count: 1 });
    await service.remove('c1');
    expect(client.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it('throws NotFound when removing a missing client', async () => {
    const { service, client } = makeService();
    client.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
