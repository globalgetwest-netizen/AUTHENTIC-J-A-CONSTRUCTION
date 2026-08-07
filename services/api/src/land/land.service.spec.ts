import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { LandService } from './land.service';

type MockCrud = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): { service: LandService; project: MockCrud; plot: MockCrud; allocation: MockCrud; document: MockCrud } {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  });
  const project = make();
  const plot = make();
  const allocation = make();
  const document = make();
  const prisma = {
    landProject: project,
    landPlot: plot,
    landAllocation: allocation,
    landDocument: document,
  } as unknown as PrismaService;
  return { service: new LandService(prisma), project, plot, allocation, document };
}

describe('LandService', () => {
  it('creates land projects with an auto LND code', async () => {
    const { service, project } = makeService();
    project.create.mockImplementation(({ data }) => Promise.resolve({ id: 'l1', ...data }));

    const created = await service.createProject({ name: 'Kwadaso Estate' });

    expect(created.code).toMatch(/^LND-/);
    expect(project.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Kwadaso Estate' }) }),
    );
  });

  it('lists projects excluding soft-deleted with search', async () => {
    const { service, project } = makeService();
    project.findMany.mockResolvedValue([{ id: 'l1' }]);
    project.count.mockResolvedValue(1);

    const result = await service.listProjects({ page: 1, pageSize: 20, search: 'estate' });

    expect(result.data).toEqual([{ id: 'l1' }]);
    expect(result.meta.total).toBe(1);
    const where = project.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('creates an allocation with an auto ALC code and marks the plot SOLD when ACTIVE', async () => {
    const { service, allocation, plot } = makeService();
    allocation.create.mockImplementation(({ data }) => Promise.resolve({ id: 'a1', ...data }));
    allocation.findFirst.mockResolvedValue({
      id: 'a1',
      plotId: 'p1',
      allocationCode: 'ALC-20260806-1A2B3C',
    });
    plot.updateMany.mockResolvedValue({ count: 1 });

    const created = await service.createAllocation({
      landProjectId: 'l1',
      plotId: 'p1',
      clientId: 'c1',
      amount: 250000,
      status: 'ACTIVE',
    });

    expect(created.allocationCode).toMatch(/^ALC-/);
    expect(plot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1', deletedAt: null },
        data: { status: 'SOLD' },
      }),
    );
  });

  it('throws NotFound when getting a missing allocation', async () => {
    const { service, allocation } = makeService();
    allocation.findFirst.mockResolvedValue(null);
    await expect(service.getAllocation('missing')).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a plot and hard-deletes an allocation', async () => {
    const { service, plot, allocation } = makeService();
    plot.updateMany.mockResolvedValue({ count: 1 });
    await service.removePlot('p1');
    expect(plot.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', deletedAt: null } }),
    );

    allocation.deleteMany.mockResolvedValue({ count: 1 });
    await service.removeAllocation('a1');
    expect(allocation.deleteMany).toHaveBeenCalledWith({ where: { id: 'a1' } });

    allocation.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeAllocation('missing')).rejects.toThrow(NotFoundException);
  });

  it('creates a land document linked to its project', async () => {
    const { service, document } = makeService();
    document.create.mockImplementation(({ data }) => Promise.resolve({ id: 'd1', ...data }));

    const created = await service.createDocument({
      landProjectId: 'l1',
      title: 'Indenture',
      fileUrl: '/uploads/indenture.pdf',
    });

    expect(created.title).toBe('Indenture');
    expect(document.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ landProjectId: 'l1' }) }),
    );
  });
});
