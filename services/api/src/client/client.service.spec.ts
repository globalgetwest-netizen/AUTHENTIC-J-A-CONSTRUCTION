import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ClientService } from './client.service';

type MockUser = Record<`findFirst`, ReturnType<typeof vi.fn>>;
type MockQuotation = Record<'findMany' | 'count' | 'findFirst', ReturnType<typeof vi.fn>>;

function makeService(): {
  service: ClientService;
  user: MockUser;
  quotation: MockQuotation;
} {
  const user: MockUser = { findFirst: vi.fn() };
  const quotation: MockQuotation = { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() };
  const prisma = { user, quotation } as unknown as PrismaService;
  return { service: new ClientService(prisma), user, quotation };
}

const LINKED_USER = {
  id: 'u1',
  email: 'client@authenticja.com',
  firstName: 'Kwame',
  lastName: 'Mensah',
  roles: [{ role: { name: 'CLIENT' } }],
  client: {
    id: 'c1',
    clientCode: 'CLI-20260806-000001',
    type: 'INDIVIDUAL',
    companyName: null,
    contactName: 'Kwame Mensah',
    email: 'client@authenticja.com',
    phone: '+233 201 234 567',
    address: null,
    status: 'ACTIVE',
  },
};

describe('ClientService', () => {
  it('returns the caller’s profile with the linked Client record', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue(LINKED_USER);

    const result = await service.profile('u1');

    expect(result.user).toEqual({
      id: 'u1',
      email: 'client@authenticja.com',
      firstName: 'Kwame',
      lastName: 'Mensah',
      roles: ['CLIENT'],
    });
    expect(result.client?.clientCode).toBe('CLI-20260806-000001');
    expect(result.client?.contactName).toBe('Kwame Mensah');
  });

  it('returns client: null for a user with no linked client', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue({
      id: 'u2',
      email: 'admin@authenticja.com',
      firstName: 'System',
      lastName: 'Administrator',
      roles: [{ role: { name: 'SUPER_ADMIN' } }],
      client: null,
    });

    const result = await service.profile('u2');

    expect(result.client).toBeNull();
    expect(result.user.roles).toEqual(['SUPER_ADMIN']);
  });

  it('throws NotFound for a soft-deleted or missing user', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue(null);

    await expect(service.profile('missing')).rejects.toThrow(NotFoundException);
  });

  it('lists only the caller’s own non-DRAFT quotations', async () => {
    const { service, user, quotation } = makeService();
    user.findFirst.mockResolvedValue({ id: 'u1', client: { id: 'c1' } });
    quotation.findMany.mockResolvedValue([
      { id: 'q1', clientId: 'c1', status: 'SENT', title: 'Foundation works' },
    ]);
    quotation.count.mockResolvedValue(1);

    const result = await service.quotations('u1');

    expect(user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1', deletedAt: null } }),
    );
    expect(quotation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: 'c1', deletedAt: null, status: { not: 'DRAFT' } },
        take: 20,
      }),
    );
    expect(result.data).toEqual([{ id: 'q1', clientId: 'c1', status: 'SENT', title: 'Foundation works' }]);
    expect(result.meta.total).toBe(1);
  });

  it('returns an empty quotation list for a user with no linked client', async () => {
    const { service, user, quotation } = makeService();
    user.findFirst.mockResolvedValue({ id: 'u3', client: null });
    quotation.findMany.mockResolvedValue([]);
    quotation.count.mockResolvedValue(0);

    const result = await service.quotations('u3');

    expect(quotation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientId: null, deletedAt: null, status: { not: 'DRAFT' } },
        take: 20,
      }),
    );
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('returns a single quotation only when it belongs to the caller’s client', async () => {
    const { service, user, quotation } = makeService();
    user.findFirst.mockResolvedValue({ id: 'u1', client: { id: 'c1' } });
    quotation.findFirst.mockResolvedValue({ id: 'q1', clientId: 'c1', status: 'SENT' });

    const result = await service.quotation('u1', 'q1');

    expect(quotation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q1', clientId: 'c1', deletedAt: null, status: { not: 'DRAFT' } },
        include: expect.objectContaining({ items: true }),
      }),
    );
    expect(result).toEqual({ id: 'q1', clientId: 'c1', status: 'SENT' });
  });

  it('throws NotFound for a quotation that is not the caller’s', async () => {
    const { service, user, quotation } = makeService();
    user.findFirst.mockResolvedValue({ id: 'u1', client: { id: 'c1' } });
    quotation.findFirst.mockResolvedValue(null);

    await expect(service.quotation('u1', 'q-other')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when the caller has no linked client', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue({ id: 'u4', client: null });

    await expect(service.quotation('u4', 'q1')).rejects.toThrow(NotFoundException);
  });
});
