import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { Lead } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'leadNo', 'name', 'expectedValue'] as const;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryLeadsDto): Promise<Paginated<Lead>> {
    const where: Prisma.LeadWhereInput = { deletedAt: null };
    if (query.source) {
      where.source = query.source;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }
    if (query.search) {
      where.OR = [
        { leadNo: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take, orderBy }),
      this.prisma.lead.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({ where: { id, deletedAt: null } });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return lead;
  }

  async create(dto: CreateLeadDto): Promise<Lead> {
    return this.prisma.lead.create({
      data: { ...dto, leadNo: dto.leadNo ?? generateBusinessCode('LD') },
    });
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    await this.ensureExists(id);
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.lead.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }
}
