import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { recordAudit } from '../common/utils/audit';
import type { AuditMeta } from '../common/utils/audit';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  permissions: { select: { permission: { select: { code: true } } } },
  _count: { select: { users: true } },
} satisfies Prisma.RoleSelect;

type RoleRow = Prisma.RoleGetPayload<{ select: typeof ROLE_SELECT }>;

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  userCount: number;
}

function toRole(row: RoleRow): RoleWithPermissions {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    permissions: row.permissions.map((p) => p.permission.code),
    userCount: row._count.users,
  };
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Roles are a small bounded catalog, so they are returned in full (no pagination). */
  async list(): Promise<RoleWithPermissions[]> {
    const rows = await this.prisma.role.findMany({ select: ROLE_SELECT, orderBy: { name: 'asc' } });
    return rows.map(toRole);
  }

  async get(id: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findUnique({ where: { id }, select: ROLE_SELECT });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return toRole(role);
  }

  async create(dto: CreateRoleDto, meta: AuditMeta): Promise<RoleWithPermissions> {
    const { permissionCodes, ...profile } = dto;
    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({ data: profile });
      if (permissionCodes && permissionCodes.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: permissionCodes } },
          select: { id: true },
        });
        if (permissions.length !== permissionCodes.length) {
          throw new BadRequestException('One or more permission codes do not exist');
        }
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: created.id, permissionId: p.id })),
        });
      }
      return tx.role.findFirstOrThrow({ where: { id: created.id }, select: ROLE_SELECT });
    });
    await recordAudit(this.prisma, 'roles.create', 'Role', role.id, { name: role.name }, meta);
    return toRole(role);
  }

  async update(id: string, dto: UpdateRoleDto, meta: AuditMeta): Promise<RoleWithPermissions> {
    await this.ensureExists(id);
    const { permissionCodes, ...profile } = dto;
    const role = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(profile).length > 0) {
        await tx.role.update({ where: { id }, data: profile });
      }
      if (permissionCodes !== undefined) {
        const permissions = await tx.permission.findMany({
          where: { code: { in: permissionCodes } },
          select: { id: true },
        });
        if (permissions.length !== permissionCodes.length) {
          throw new BadRequestException('One or more permission codes do not exist');
        }
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((p) => ({ roleId: id, permissionId: p.id })),
          });
        }
      }
      return tx.role.findFirstOrThrow({ where: { id }, select: ROLE_SELECT });
    });
    await recordAudit(this.prisma, 'roles.update', 'Role', id, undefined, meta);
    return toRole(role);
  }

  async remove(id: string, meta: AuditMeta): Promise<void> {
    const count = await this.prisma.$transaction(async (tx) => {
      const inUse = await tx.userRole.count({ where: { roleId: id } });
      if (inUse > 0) {
        throw new ConflictException('Cannot delete a role that is assigned to users');
      }
      const deleted = await tx.role.deleteMany({ where: { id } });
      return deleted.count;
    });
    if (count === 0) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    await recordAudit(this.prisma, 'roles.delete', 'Role', id, undefined, meta);
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException(`Role ${id} not found`);
    }
  }
}
