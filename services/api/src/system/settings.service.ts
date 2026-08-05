import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { SystemSetting } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { CreateSettingDto } from './dto/create-setting.dto';
import { QuerySettingsDto } from './dto/query-settings.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'key', 'type'] as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QuerySettingsDto): Promise<Paginated<SystemSetting>> {
    const where: Prisma.SystemSettingWhereInput = {};
    if (query.search) {
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.systemSetting.findMany({ where, skip, take, orderBy }),
      this.prisma.systemSetting.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getByKey(key: string): Promise<SystemSetting> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
    return setting;
  }

  create(dto: CreateSettingDto): Promise<SystemSetting> {
    return this.prisma.systemSetting.create({ data: dto });
  }

  async updateByKey(key: string, dto: UpdateSettingDto): Promise<SystemSetting> {
    await this.ensureExists(key);
    return this.prisma.systemSetting.update({ where: { key }, data: dto });
  }

  async removeByKey(key: string): Promise<void> {
    const result = await this.prisma.systemSetting.deleteMany({ where: { key } });
    if (result.count === 0) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
  }

  private async ensureExists(key: string): Promise<void> {
    const exists = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
  }
}
