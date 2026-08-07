import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type LandAllocation,
  type LandDocument,
  type LandPlot,
  type LandProject,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateLandProjectDto } from './dto/create-land-project.dto';
import { UpdateLandProjectDto } from './dto/update-land-project.dto';
import { CreateLandPlotDto } from './dto/create-land-plot.dto';
import { UpdateLandPlotDto } from './dto/update-land-plot.dto';
import { CreateLandAllocationDto } from './dto/create-land-allocation.dto';
import { UpdateLandAllocationDto } from './dto/update-land-allocation.dto';
import { CreateLandDocumentDto } from './dto/create-land-document.dto';
import {
  QueryLandAllocationsDto,
  QueryLandDocumentsDto,
  QueryLandPlotsDto,
  QueryLandProjectsDto,
} from './dto/query-land.dto';

const PROJECT_SORTABLE = ['createdAt', 'name', 'code', 'status'] as const;
const PLOT_SORTABLE = ['createdAt', 'plotNumber', 'sizeSqm', 'pricePerSqm', 'status'] as const;
const ALLOCATION_SORTABLE = ['createdAt', 'allocationCode', 'amount', 'status', 'allocatedAt'] as const;
const DOCUMENT_SORTABLE = ['createdAt', 'title'] as const;

const PROJECT_COUNT = { _count: { select: { plots: true, allocations: true } } } as const;
const PLOT_INCLUDE = { landProject: true, allocation: true } as const;
const ALLOCATION_INCLUDE = { landProject: true, plot: true, client: true } as const;

@Injectable()
export class LandService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Land projects ────────────────────────────────────────────────────────

  async listProjects(query: QueryLandProjectsDto): Promise<Paginated<object>> {
    const where: Prisma.LandProjectWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PROJECT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.landProject.findMany({ where, skip, take, orderBy, include: PROJECT_COUNT }),
      this.prisma.landProject.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getProject(id: string): Promise<LandProject> {
    const project = await this.prisma.landProject.findFirst({
      where: { id, deletedAt: null },
      include: { plots: true },
    });
    if (!project) throw new NotFoundException(`Land project ${id} not found`);
    return project;
  }

  async createProject(dto: CreateLandProjectDto): Promise<LandProject> {
    return this.prisma.landProject.create({
      data: { ...dto, code: dto.code ?? generateBusinessCode('LND') },
    });
  }

  async updateProject(id: string, dto: UpdateLandProjectDto): Promise<LandProject> {
    await this.ensureProject(id);
    return this.prisma.landProject.update({ where: { id }, data: dto });
  }

  async removeProject(id: string): Promise<void> {
    await this.softDelete(id, 'Land project');
  }

  private async ensureProject(id: string): Promise<void> {
    const exists = await this.prisma.landProject.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Land project ${id} not found`);
  }

  // ── Land plots ───────────────────────────────────────────────────────────

  async listPlots(query: QueryLandPlotsDto): Promise<Paginated<object>> {
    const where: Prisma.LandPlotWhereInput = { deletedAt: null };
    if (query.landProjectId) where.landProjectId = query.landProjectId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { plotNumber: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PLOT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.landPlot.findMany({ where, skip, take, orderBy, include: PLOT_INCLUDE }),
      this.prisma.landPlot.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPlot(id: string): Promise<LandPlot> {
    const plot = await this.prisma.landPlot.findFirst({
      where: { id, deletedAt: null },
      include: PLOT_INCLUDE,
    });
    if (!plot) throw new NotFoundException(`Land plot ${id} not found`);
    return plot;
  }

  async createPlot(dto: CreateLandPlotDto): Promise<LandPlot> {
    return this.prisma.landPlot.create({ data: dto, include: PLOT_INCLUDE });
  }

  async updatePlot(id: string, dto: UpdateLandPlotDto): Promise<LandPlot> {
    await this.ensurePlot(id);
    return this.prisma.landPlot.update({ where: { id }, data: dto, include: PLOT_INCLUDE });
  }

  async removePlot(id: string): Promise<void> {
    await this.softDelete(id, 'Land plot');
  }

  private async ensurePlot(id: string): Promise<void> {
    const exists = await this.prisma.landPlot.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Land plot ${id} not found`);
  }

  // ── Land allocations ─────────────────────────────────────────────────────

  async listAllocations(query: QueryLandAllocationsDto): Promise<Paginated<object>> {
    const where: Prisma.LandAllocationWhereInput = {};
    if (query.landProjectId) where.landProjectId = query.landProjectId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { allocationCode: { contains: query.search, mode: 'insensitive' } },
        { client: { is: { companyName: { contains: query.search, mode: 'insensitive' } } } },
        { client: { is: { contactName: { contains: query.search, mode: 'insensitive' } } } },
        { plot: { is: { plotNumber: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, ALLOCATION_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.landAllocation.findMany({ where, skip, take, orderBy, include: ALLOCATION_INCLUDE }),
      this.prisma.landAllocation.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getAllocation(id: string): Promise<LandAllocation> {
    const allocation = await this.prisma.landAllocation.findFirst({
      where: { id },
      include: ALLOCATION_INCLUDE,
    });
    if (!allocation) throw new NotFoundException(`Land allocation ${id} not found`);
    return allocation;
  }

  async createAllocation(dto: CreateLandAllocationDto): Promise<LandAllocation> {
    const status = dto.status ?? 'PENDING';
    const allocation = await this.prisma.landAllocation.create({
      data: {
        landProjectId: dto.landProjectId,
        plotId: dto.plotId,
        clientId: dto.clientId,
        allocationCode: generateBusinessCode('ALC'),
        amount: dto.amount,
        status,
        allocatedAt: dto.allocatedAt ? new Date(dto.allocatedAt) : new Date(),
        signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
      },
    });
    await this.syncPlotStatus(dto.plotId, status);
    return this.getAllocation(allocation.id);
  }

  async updateAllocation(id: string, dto: UpdateLandAllocationDto): Promise<LandAllocation> {
    await this.ensureAllocation(id);
    const status = dto.status;
    const data: Prisma.LandAllocationUncheckedUpdateInput = {
      landProjectId: dto.landProjectId,
      plotId: dto.plotId,
      clientId: dto.clientId,
      amount: dto.amount,
      status,
      allocatedAt: dto.allocatedAt ? new Date(dto.allocatedAt) : undefined,
      signedAt: dto.signedAt !== undefined ? (dto.signedAt ? new Date(dto.signedAt) : null) : undefined,
    };
    const allocation = await this.prisma.landAllocation.update({ where: { id }, data });
    if (dto.plotId && status) await this.syncPlotStatus(dto.plotId, status);
    return this.getAllocation(allocation.id);
  }

  async removeAllocation(id: string): Promise<void> {
    const result = await this.prisma.landAllocation.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Land allocation ${id} not found`);
  }

  private async ensureAllocation(id: string): Promise<void> {
    const exists = await this.prisma.landAllocation.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Land allocation ${id} not found`);
  }

  /** An active or completed allocation marks its plot SOLD. */
  private async syncPlotStatus(plotId: string, status: string): Promise<void> {
    if (status === 'ACTIVE' || status === 'COMPLETED') {
      await this.prisma.landPlot.updateMany({
        where: { id: plotId, deletedAt: null },
        data: { status: 'SOLD' },
      });
    }
  }

  // ── Land documents (uploaded files) ──────────────────────────────────────

  async listDocuments(query: QueryLandDocumentsDto): Promise<Paginated<object>> {
    const where: Prisma.LandDocumentWhereInput = {};
    if (query.landProjectId) where.landProjectId = query.landProjectId;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, DOCUMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.landDocument.findMany({ where, skip, take, orderBy, include: { landProject: true } }),
      this.prisma.landDocument.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getDocument(id: string): Promise<LandDocument> {
    const document = await this.prisma.landDocument.findFirst({
      where: { id },
      include: { landProject: true },
    });
    if (!document) throw new NotFoundException(`Land document ${id} not found`);
    return document;
  }

  async createDocument(dto: CreateLandDocumentDto): Promise<LandDocument> {
    return this.prisma.landDocument.create({ data: dto, include: { landProject: true } });
  }

  async removeDocument(id: string): Promise<void> {
    const result = await this.prisma.landDocument.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Land document ${id} not found`);
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  private async softDelete(id: string, label: string): Promise<void> {
    const where = { id, deletedAt: null } as const;
    const data = { deletedAt: new Date() } as const;
    const result =
      label === 'Land project'
        ? await this.prisma.landProject.updateMany({ where, data })
        : await this.prisma.landPlot.updateMany({ where, data });
    if (result.count === 0) throw new NotFoundException(`${label} ${id} not found`);
  }
}
