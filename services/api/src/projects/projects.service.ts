import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { Project } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateProjectDto } from './dto/create-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'code', 'name', 'status', 'budgetAmount'] as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryProjectsDto): Promise<Paginated<Project>> {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };
    if (query.projectType) {
      where.projectType = query.projectType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({ where, skip, take, orderBy }),
      this.prisma.project.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: { ...dto, code: dto.code ?? generateBusinessCode('PRJ') },
    });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.ensureExists(id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.project.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Project ${id} not found`);
    }
  }
}
