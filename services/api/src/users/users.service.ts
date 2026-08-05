import { Injectable, NotFoundException } from '@nestjs/common';
import { hashPassword } from '@ajac/auth';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { buildOrderBy, paginate, prismaSkipTake } from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { recordAudit } from '../common/utils/audit';
import type { AuditMeta } from '../common/utils/audit';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { id: true, name: true } } } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SAFE_SELECT }>;

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{ id: string; name: string }>;
}

const SORTABLE = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'] as const;

function toSafeUser(row: UserRow): SafeUser {
  return { ...row, roles: row.roles.map((r) => r.role) };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryUsersDto): Promise<Paginated<SafeUser>> {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.roleId) {
      where.roles = { some: { roleId: query.roleId } };
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, orderBy, select: USER_SAFE_SELECT }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(data.map(toSafeUser), total, query);
  }

  async get(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SAFE_SELECT,
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return toSafeUser(user);
  }

  async create(dto: CreateUserDto, meta: AuditMeta): Promise<SafeUser> {
    const { roleIds, password, ...profile } = dto;
    const passwordHash = await hashPassword(password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { ...profile, passwordHash } });
      if (roleIds && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: created.id, roleId })),
        });
      }
      return tx.user.findFirstOrThrow({ where: { id: created.id }, select: USER_SAFE_SELECT });
    });
    await recordAudit(this.prisma, 'users.create', 'User', user.id, { email: user.email }, meta);
    return toSafeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, meta: AuditMeta): Promise<SafeUser> {
    await this.ensureExists(id);
    const { roleIds, password, ...profile } = dto;
    const user = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.UserUpdateInput = { ...profile };
      if (password) {
        data.passwordHash = await hashPassword(password);
        await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await tx.user.update({ where: { id }, data });
      if (roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
      }
      return tx.user.findFirstOrThrow({ where: { id }, select: USER_SAFE_SELECT });
    });
    await recordAudit(this.prisma, 'users.update', 'User', id, undefined, meta);
    return toSafeUser(user);
  }

  async remove(id: string, actorId: string, meta: AuditMeta): Promise<void> {
    if (id === actorId) {
      throw new NotFoundException(`User ${id} not found`);
    }
    const count = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (result.count > 0) {
        await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return result.count;
    });
    if (count === 0) {
      throw new NotFoundException(`User ${id} not found`);
    }
    await recordAudit(this.prisma, 'users.delete', 'User', id, undefined, meta);
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
