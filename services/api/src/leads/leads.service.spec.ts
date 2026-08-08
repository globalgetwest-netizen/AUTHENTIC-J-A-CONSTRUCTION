import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from './leads.service';

type MockLead = Record<
  'findMany' | 'count' | 'findFirst' | 'create' | 'update' | 'updateMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: LeadsService; lead: MockLead } {
  const lead: MockLead = {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { lead } as unknown as PrismaService;
  return { service: new LeadsService(prisma), lead };
}

describe('LeadsService', () => {
  it('lists non-deleted leads, applying source/status/assignedToId filters', async () => {
    const { service, lead } = makeService();
    lead.findMany.mockResolvedValue([{ id: 'l1' }]);
    lead.count.mockResolvedValue(1);

    const result = await service.list({
      page: 2,
      pageSize: 10,
      source: 'WEBSITE',
      status: 'NEW',
      assignedToId: 'u1',
    });

    expect(lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    expect(result.data).toEqual([{ id: 'l1' }]);
    expect(result.meta.total).toBe(1);
    const where = lead.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.source).toBe('WEBSITE');
    expect(where.status).toBe('NEW');
    expect(where.assignedToId).toBe('u1');
  });

  it('searches across lead fields case-insensitively', async () => {
    const { service, lead } = makeService();
    lead.findMany.mockResolvedValue([]);
    lead.count.mockResolvedValue(0);

    await service.list({ page: 1, pageSize: 20, search: 'akwa' });

    const where = lead.findMany.mock.calls[0]?.[0]?.where;
    expect(where.OR).toEqual([
      { leadNo: { contains: 'akwa', mode: 'insensitive' } },
      { name: { contains: 'akwa', mode: 'insensitive' } },
      { company: { contains: 'akwa', mode: 'insensitive' } },
      { email: { contains: 'akwa', mode: 'insensitive' } },
    ]);
  });

  it('auto-generates a leadNo when none is supplied', async () => {
    const { service, lead } = makeService();
    lead.create.mockImplementation(({ data }) => Promise.resolve({ ...data, id: 'l1' }));

    const created = await service.create({ name: 'Ama Mensah' });

    expect(created.leadNo).toMatch(/^LD-/);
  });

  it('throws NotFound when getting a missing lead', async () => {
    const { service, lead } = makeService();
    lead.findFirst.mockResolvedValue(null);

    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('ensures existence before updating', async () => {
    const { service, lead } = makeService();
    lead.findFirst.mockResolvedValue(null);

    await expect(service.update('missing', { name: 'New' })).rejects.toThrow(NotFoundException);
    expect(lead.update).not.toHaveBeenCalled();
  });

  it('soft-deletes and throws NotFound when nothing matched', async () => {
    const { service, lead } = makeService();
    lead.updateMany.mockResolvedValue({ count: 1 });

    await service.remove('l1');

    expect(lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'l1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );

    lead.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
