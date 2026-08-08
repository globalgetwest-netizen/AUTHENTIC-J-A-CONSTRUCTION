import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { CompanyService } from './company.service';

type MockCompany = Record<'findFirst' | 'create' | 'update', ReturnType<typeof vi.fn>>;

function makeService(): { service: CompanyService; company: MockCompany } {
  const company: MockCompany = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const prisma = { company } as unknown as PrismaService;
  return { service: new CompanyService(prisma), company };
}

describe('CompanyService', () => {
  it('returns the oldest company profile', async () => {
    const { service, company } = makeService();
    company.findFirst.mockResolvedValue({ id: 'c1', name: 'Authentic J.A. Construction Ltd.' });

    const result = await service.get();

    expect(company.findFirst).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
    expect(result.id).toBe('c1');
  });

  it('throws NotFound when no company profile has been set up', async () => {
    const { service, company } = makeService();
    company.findFirst.mockResolvedValue(null);

    await expect(service.get()).rejects.toThrow(NotFoundException);
    await expect(service.update({ name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('creates a company profile', async () => {
    const { service, company } = makeService();
    company.create.mockResolvedValue({ id: 'c1' });

    await service.create({ name: 'Authentic J.A. Construction Ltd.' });

    expect(company.create).toHaveBeenCalledWith({
      data: { name: 'Authentic J.A. Construction Ltd.' },
    });
  });

  it('updates the existing company profile', async () => {
    const { service, company } = makeService();
    company.findFirst.mockResolvedValue({ id: 'c1' });
    company.update.mockResolvedValue({ id: 'c1', name: 'Updated' });

    const result = await service.update({ name: 'Updated' });

    expect(company.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { name: 'Updated' } });
    expect(result.name).toBe('Updated');
  });
});
