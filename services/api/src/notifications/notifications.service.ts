import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { buildOrderBy, paginate, prismaSkipTake } from '../common/dto/pagination.dto';
import type { PaginationMeta } from '../common/dto/pagination.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

/** Payload accepted by {@link NotificationsService.notify}. */
export interface NotifyInput {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  link?: string;
}

type NotificationRow = import('@ajac/database').Notification;

/** Paginated notifications plus the caller's still-unread count. */
export interface NotificationsList {
  data: NotificationRow[];
  meta: PaginationMeta & { totalUnread: number };
}

/**
 * The user's own notification feed. Every list/mutate operation is scoped to
 * the caller's `userId`, so a caller can only ever read or acknowledge their
 * own rows. Also the single creation entry point (`notify`) that project
 * workflows and the seed use to push in-app notifications.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: QueryNotificationsDto): Promise<NotificationsList> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { body: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, ['createdAt'] as const);
    const [data, total, totalUnread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy,
        ...prismaSkipTake(query),
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const meta = paginate(data, total, query).meta;
    return {
      data,
      meta: { ...meta, totalUnread },
    };
  }

  async unreadCount(userId: string): Promise<{ totalUnread: number }> {
    const totalUnread = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { totalUnread };
  }

  async markRead(userId: string, id: string): Promise<NotificationRow> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    // Idempotent: acknowledging an already-read row returns it unchanged.
    if (existing.readAt) {
      return existing;
    }
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }

  /**
   * Creates a notification for a single user. When the recipient's account no
   * longer exists or is disabled/deleted, the notification is silently dropped
   * (returning null) rather than failing the caller's workflow — a project
   * event arriving for a manager who was removed meanwhile must not break the
   * work-log operation that produced it.
   */
  async notify(input: NotifyInput): Promise<NotificationRow | null> {
    if (!input.userId) {
      return null;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? NotificationType.SYSTEM,
        title: input.title,
        body: input.body,
        data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
        link: input.link,
        readAt: null,
      },
    });
  }
}

