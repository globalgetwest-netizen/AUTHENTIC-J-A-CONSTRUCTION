import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { Client } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'clientCode', 'contactName', 'companyName'] as const;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryClientsDto): Promise<Paginated<Client>> {
    const where: Prisma.ClientWhereInput = { deletedAt: null };
    if (query.type) {
      where.type = query.type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { clientCode: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.client.findMany({ where, skip, take, orderBy }),
      this.prisma.client.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return client;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    return this.prisma.client.create({
      data: { ...dto, clientCode: dto.clientCode ?? generateBusinessCode('CLI') },
    });
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.client.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Client ${id} not found`);
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Client ${id} not found`);
    }
  }
}
