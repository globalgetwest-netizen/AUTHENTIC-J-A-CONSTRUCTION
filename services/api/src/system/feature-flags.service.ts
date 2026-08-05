import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { FeatureFlag } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { QueryFeatureFlagsDto } from './dto/query-feature-flags.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'key', 'enabled'] as const;

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryFeatureFlagsDto): Promise<Paginated<FeatureFlag>> {
    const where: Prisma.FeatureFlagWhereInput = {};
    if (query.search) {
      where.OR = [
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.featureFlag.findMany({ where, skip, take, orderBy }),
      this.prisma.featureFlag.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getByKey(key: string): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }
    return flag;
  }

  create(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    return this.prisma.featureFlag.create({ data: dto });
  }

  async updateByKey(key: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    await this.ensureExists(key);
    return this.prisma.featureFlag.update({ where: { key }, data: dto });
  }

  async removeByKey(key: string): Promise<void> {
    const result = await this.prisma.featureFlag.deleteMany({ where: { key } });
    if (result.count === 0) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }
  }

  private async ensureExists(key: string): Promise<void> {
    const exists = await this.prisma.featureFlag.findUnique({
      where: { key },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Feature flag "${key}" not found`);
    }
  }
}
