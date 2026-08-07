import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';

const PROFILE_INCLUDE = {
  roles: { include: { role: { select: { name: true } } } },
  client: true,
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{ include: typeof PROFILE_INCLUDE }>;

const QUOTATION_INCLUDE = {
  client: true,
  project: true,
  items: true,
} satisfies Prisma.QuotationInclude;

const QUOTATIONS_LIMIT = 20;

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Self-scoped profile for the calling principal: the user's identity plus their
   * linked Client record (when one exists). Never returns another person's data.
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
      client: user.client,
    };
  }

  /**
   * The caller's own quotations, newest first. Only client-facing records are
   * shown (issued, not DRAFT drafts) and only for the client linked to the caller.
   */
  async quotations(userId: string) {
    const clientId = await this.clientIdOf(userId);
    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where: { clientId, deletedAt: null, status: { not: 'DRAFT' } },
        include: QUOTATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: QUOTATIONS_LIMIT,
      }),
      this.prisma.quotation.count({
        where: { clientId, deletedAt: null, status: { not: 'DRAFT' } },
      }),
    ]);
    return { data, meta: { total, limit: QUOTATIONS_LIMIT } };
  }

  /**
   * A single quotation owned by the caller's client, with the relations the PDF
   * renderer needs. 404 if the client has no linked record or the quotation is
   * not theirs (or is deleted / still a DRAFT).
   */
  async quotation(userId: string, quotationId: string) {
    const clientId = await this.clientIdOf(userId);
    if (!clientId) {
      throw new NotFoundException('Quotation not found');
    }
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        id: quotationId,
        clientId,
        deletedAt: null,
        status: { not: 'DRAFT' },
      },
      include: QUOTATION_INCLUDE,
    });
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }
    return quotation;
  }

  /** Resolves the caller's linked Client id, or null when none is linked. */
  private async clientIdOf(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { client: { select: { id: true } } },
    });
    return user?.client?.id ?? null;
  }
}

function rolesOf(user: UserWithProfile): string[] {
  return user.roles.map((r) => r.role.name);
}