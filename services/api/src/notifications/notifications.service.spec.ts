import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

function makeService(): {
  service: NotificationsService;
  notification: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  user: { findUnique: ReturnType<typeof vi.fn> };
} {
  const notification = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const user = { findUnique: vi.fn() };
  const prisma = {
    notification,
    user,
    $transaction: vi.fn((arg: unknown) =>
      Array.isArray(arg)
        ? Promise.all(arg as Promise<unknown>[])
        : typeof arg === 'function'
          ? arg(prisma)
          : Promise.resolve(arg),
    ),
  } as unknown as PrismaService;
  return { service: new NotificationsService(prisma), notification, user };
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 'n1',
  userId: 'u1',
  type: NotificationType.SYSTEM,
  title: 'Hello',
  body: null,
  data: null,
  link: null,
  readAt: null,
  createdAt: new Date('2026-08-01'),
  ...over,
});

describe('NotificationsService', () => {
  it('lists the caller notifications newest-first with unread totals', async () => {
    const { service, notification } = makeService();
    notification.findMany.mockResolvedValue([row()]);
    notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const res = await service.list('u1', {});

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
    expect(res.meta).toMatchObject({ total: 1, totalUnread: 0 });
    expect(res.data).toHaveLength(1);
  });

  it('filters the list to unread only when requested', async () => {
    const { service, notification } = makeService();
    notification.findMany.mockResolvedValue([row()]);
    notification.count.mockResolvedValue(0);

    await service.list('u1', { unreadOnly: true });

    expect(notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', readAt: null } }),
    );
  });

  it('returns the unread count only', async () => {
    const { service, notification } = makeService();
    notification.count.mockResolvedValue(3);

    await expect(service.unreadCount('u1')).resolves.toEqual({ totalUnread: 3 });
    expect(notification.count).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
    });
  });

  it('marks a scoped notification as read', async () => {
    const { service, notification } = makeService();
    notification.findFirst.mockResolvedValue(row());
    notification.update.mockImplementation(async ({ data }) => row({ ...data }));

    const res = await service.markRead('u1', 'n1');

    expect(notification.findFirst).toHaveBeenCalledWith({ where: { id: 'n1', userId: 'u1' } });
    expect(notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n1' }, data: { readAt: expect.any(Date) } }),
    );
    expect(res.readAt).toBeInstanceOf(Date);
  });

  it('is idempotent when the notification is already read', async () => {
    const { service, notification } = makeService();
    notification.findFirst.mockResolvedValue(row({ readAt: new Date('2026-08-02') }));

    const res = await service.markRead('u1', 'n1');

    expect(notification.update).not.toHaveBeenCalled();
    expect(res.readAt).toBeInstanceOf(Date);
  });

  it('throws when the notification does not belong to the caller', async () => {
    const { service, notification } = makeService();
    notification.findFirst.mockResolvedValue(null);

    await expect(service.markRead('u1', 'n1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks every unread notification as read for the caller only', async () => {
    const { service, notification } = makeService();
    notification.updateMany.mockResolvedValue({ count: 4 });

    const res = await service.markAllRead('u1');

    expect(notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
    expect(res).toEqual({ updated: 4 });
  });

  it('creates a notification with a SYSTEM default type', async () => {
    const { service, notification, user } = makeService();
    user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, deletedAt: null });
    notification.create.mockImplementation(({ data }) => Promise.resolve({ id: 'n1', ...data }));

    const res = await service.notify({ userId: 'u1', title: 'Welcome', link: '/staff' });

    expect(res).toMatchObject({
      userId: 'u1',
      title: 'Welcome',
      type: NotificationType.SYSTEM,
      link: '/staff',
      readAt: null,
    });
  });

  it('honours an explicit type and payload', async () => {
    const { service, notification, user } = makeService();
    user.findUnique.mockResolvedValue({ id: 'u1', isActive: true, deletedAt: null });
    notification.create.mockImplementation(({ data }) => Promise.resolve({ id: 'n1', ...data }));

    const res = await service.notify({
      userId: 'u1',
      type: NotificationType.PAYROLL,
      title: 'Payslip ready',
      body: 'August 2026',
      data: { payslipId: 'p1' },
    });

    expect(res).toMatchObject({
      type: NotificationType.PAYROLL,
      title: 'Payslip ready',
      data: { payslipId: 'p1' },
    });
  });

  it('drops the notification silently when the recipient is disabled', async () => {
    const { service, notification, user } = makeService();
    user.findUnique.mockResolvedValue({ id: 'u1', isActive: false, deletedAt: null });

    await expect(service.notify({ userId: 'u1', title: 'x' })).resolves.toBeNull();
    expect(notification.create).not.toHaveBeenCalled();
  });

  it('drops the notification silently for an unknown recipient', async () => {
    const { service, notification, user } = makeService();
    user.findUnique.mockResolvedValue(null);

    await expect(service.notify({ userId: 'ghost', title: 'x' })).resolves.toBeNull();
    expect(notification.create).not.toHaveBeenCalled();
  });
});