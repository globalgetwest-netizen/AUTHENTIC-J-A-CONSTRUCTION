import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { QuotationsService } from './quotations.service';

type MockQuotation = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: QuotationsService;
  quotation: MockQuotation;
} {
  const quotation: MockQuotation = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const prisma = { quotation } as unknown as PrismaService;
  return { service: new QuotationsService(prisma), quotation };
}

describe('QuotationsService', () => {
  it('computes subtotal, VAT and total from line items on create', async () => {
    const { service, quotation } = makeService();
    quotation.create.mockImplementation(({ data }) => Promise.resolve({ id: 'q1', ...data }));

    const created = await service.create({
      title: 'Fence works',
      clientId: 'c1',
      taxRate: 15,
      items: [
        { description: 'Foundation', quantity: 2, unitPrice: 1000 },
        { description: 'Wire mesh', quantity: 5, unitPrice: 200 },
      ],
    });

    expect(created.quotationNo).toMatch(/^QT-/);
    expect(created.subtotal).toBe('3000.00');
    expect(created.tax).toBe('450.00');
    expect(created.total).toBe('3450.00');
  });

  it('defaults tax to zero when no rate is supplied', async () => {
    const { service, quotation } = makeService();
    quotation.create.mockImplementation(({ data }) => Promise.resolve({ id: 'q1', ...data }));

    const created = await service.create({
      title: 'No tax',
      items: [{ description: 'Labour', quantity: 1, unitPrice: 100 }],
    });

    expect(created.tax).toBe('0.00');
    expect(created.total).toBe('100.00');
  });

  it('lists non-deleted quotations, applying filters and search', async () => {
    const { service, quotation } = makeService();
    quotation.findMany.mockResolvedValue([{ id: 'q1' }]);
    quotation.count.mockResolvedValue(1);

    const result = await service.list({
      page: 2,
      pageSize: 10,
      status: 'SENT',
      clientId: 'c1',
      search: 'fence',
    });

    expect(quotation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.data).toEqual([{ id: 'q1' }]);
    expect(result.meta.total).toBe(1);
    const where = quotation.findMany.mock.calls[0]?.[0]?.where;
    expect(where.deletedAt).toBeNull();
    expect(where.status).toBe('SENT');
    expect(where.clientId).toBe('c1');
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it('throws NotFound for a missing or soft-deleted quotation', async () => {
    const { service, quotation } = makeService();
    quotation.findFirst.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toThrow(NotFoundException);
  });

  it('replaces line items and recomputes totals on update', async () => {
    const { service, quotation } = makeService();
    quotation.findFirst.mockResolvedValue({
      id: 'q1',
      subtotal: '1000.00',
      tax: '150.00',
      discount: '0.00',
      total: '1150.00',
    });
    quotation.update.mockImplementation(({ data }) => Promise.resolve({ id: 'q1', ...data }));

    const updated = await service.update('q1', {
      items: [{ description: 'Revised scope', quantity: 1, unitPrice: 500 }],
      taxRate: 10,
    });

    expect(updated.subtotal).toBe('500.00');
    expect(updated.tax).toBe('50.00');
    expect(updated.total).toBe('550.00');
    expect(quotation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ items: expect.objectContaining({ deleteMany: {} }) }),
      }),
    );
  });

  it('preserves totals on a status-only update', async () => {
    const { service, quotation } = makeService();
    quotation.findFirst.mockResolvedValue({
      id: 'q1',
      subtotal: '1000.00',
      tax: '150.00',
      discount: '0.00',
      total: '1150.00',
    });
    quotation.update.mockImplementation(({ data }) => Promise.resolve({ id: 'q1', ...data }));

    const updated = await service.update('q1', { status: 'SENT' });

    expect(updated.subtotal).toBe('1000.00');
    expect(updated.tax).toBe('150.00');
    expect(updated.total).toBe('1150.00');
    expect(updated.status).toBe('SENT');
  });

  it('soft-deletes instead of hard-deleting', async () => {
    const { service, quotation } = makeService();
    quotation.updateMany.mockResolvedValue({ count: 1 });
    await service.remove('q1');
    expect(quotation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it('throws NotFound when removing a missing quotation', async () => {
    const { service, quotation } = makeService();
    quotation.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
