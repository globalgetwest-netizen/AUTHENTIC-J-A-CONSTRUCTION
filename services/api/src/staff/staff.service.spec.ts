import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { StaffService } from './staff.service';

type MockUser = Record<`findFirst`, ReturnType<typeof vi.fn>>;
type MockNotification = Record<'findMany' | 'count', ReturnType<typeof vi.fn>>;

function makeService(): {
  service: StaffService;
  user: MockUser;
  notification: MockNotification;
} {
  const user: MockUser = { findFirst: vi.fn() };
  const notification: MockNotification = { findMany: vi.fn(), count: vi.fn() };
  const prisma = { user, notification } as unknown as PrismaService;
  return { service: new StaffService(prisma), user, notification };
}

const LINKED_USER = {
  id: 'u1',
  email: 'ama@authenticja.com',
  firstName: 'Ama',
  lastName: 'Owusu',
  roles: [{ role: { name: 'STAFF' } }],
  employee: {
    id: 'e1',
    employeeCode: 'EMP-20260806-000001',
    firstName: 'Ama',
    lastName: 'Owusu',
    email: 'ama@authenticja.com',
    phone: '+233 245 295 866',
    employmentType: 'FULL_TIME',
    hireDate: new Date('2026-08-01'),
    department: { id: 'd1', name: 'Operations' },
    position: { id: 'p1', title: 'Site Foreman' },
    branch: { id: 'b1', name: 'Kumasi HQ' },
  },
};

describe('StaffService', () => {
  it('returns the caller’s profile with the linked Employee relations', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue(LINKED_USER);

    const result = await service.profile('u1');

    expect(result.user).toEqual({
      id: 'u1',
      email: 'ama@authenticja.com',
      firstName: 'Ama',
      lastName: 'Owusu',
      roles: ['STAFF'],
    });
    expect(result.employee?.employeeCode).toBe('EMP-20260806-000001');
    expect(result.employee?.department?.name).toBe('Operations');
    expect(result.employee?.position?.title).toBe('Site Foreman');
    expect(result.employee?.branch?.name).toBe('Kumasi HQ');
  });

  it('returns employee: null for a user with no linked employee', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue({
      id: 'u2',
      email: 'admin@authenticja.com',
      firstName: 'System',
      lastName: 'Administrator',
      roles: [{ role: { name: 'SUPER_ADMIN' } }],
      employee: null,
    });

    const result = await service.profile('u2');

    expect(result.employee).toBeNull();
    expect(result.user.roles).toEqual(['SUPER_ADMIN']);
  });

  it('throws NotFound for a soft-deleted or missing user', async () => {
    const { service, user } = makeService();
    user.findFirst.mockResolvedValue(null);

    await expect(service.profile('missing')).rejects.toThrow(NotFoundException);
  });

  it('lists only the caller’s notifications with an unread count', async () => {
    const { service, notification } = makeService();
    notification.findMany.mockResolvedValue([{ id: 'n1', userId: 'u1' }]);
    notification.count.mockResolvedValueOnce(1); // total
    notification.count.mockResolvedValueOnce(1); // totalUnread

    const result = await service.notifications('u1');

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, take: 20 }),
    );
    expect(result.data).toEqual([{ id: 'n1', userId: 'u1' }]);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalUnread).toBe(1);
    expect(notification.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
    );
  });
});