import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';

const PROFILE_INCLUDE = {
  roles: { include: { role: { select: { name: true } } } },
  employee: {
    include: { department: true, position: true, branch: true },
  },
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{ include: typeof PROFILE_INCLUDE }>;

const NOTIFICATIONS_LIMIT = 20;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Self-scoped profile for the calling principal: the user's identity plus their
   * linked Employee record (when one exists). Never returns another person's data.
   */
  async profile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: PROFILE_INCLUDE,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: rolesOf(user),
      },
      employee: user.employee,
    };
  }

  /** The caller's own notifications, newest first, plus an unread count. */
  async notifications(userId: string) {
    const [data, total, totalUnread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: NOTIFICATIONS_LIMIT,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { data, meta: { total, totalUnread, limit: NOTIFICATIONS_LIMIT } };
  }
}

function rolesOf(user: UserWithProfile): string[] {
  return user.roles.map((r) => r.role.name);
}