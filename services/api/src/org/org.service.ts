import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateCompanyBranchDto } from './dto/create-company-branch.dto';
import { UpdateCompanyBranchDto } from './dto/update-company-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryOrgDto } from './dto/query-org.dto';

const BRANCH_SORTABLE = ['createdAt', 'name', 'code', 'location'] as const;
const DEPARTMENT_SORTABLE = ['createdAt', 'name', 'code'] as const;
const POSITION_SORTABLE = ['createdAt', 'title', 'code', 'level'] as const;

const EMPLOYEE_COUNT = { _count: { select: { employees: true } } } as const;

/** Minimal shape of the three soft-deletable, count-able delegates. */
type OrgDelegate = {
  findFirst(args: {
    where: { id: string; deletedAt: null };
    select?: { id: true };
  }): Promise<{ id: string } | null>;
  updateMany(args: {
    where: { id: string; deletedAt: null };
    data: { deletedAt: Date };
  }): Promise<{ count: number }>;
};

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  private async companyId(): Promise<string> {
    const company = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!company) {
      throw new NotFoundException('No company is configured — run the seed first.');
    }
    return company.id;
  }

  // ── Company branches ────────────────────────────────────────────────────

  async listBranches(query: QueryOrgDto): Promise<Paginated<object>> {
    const where: Prisma.CompanyBranchWhereInput = {
      deletedAt: null,
      companyId: await this.companyId(),
    };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, BRANCH_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.companyBranch.findMany({ where, skip, take, orderBy, include: EMPLOYEE_COUNT }),
      this.prisma.companyBranch.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getBranch(id: string) {
    const branch = await this.prisma.companyBranch.findFirst({
      where: { id, deletedAt: null },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async createBranch(dto: CreateCompanyBranchDto) {
    const companyId = await this.companyId();
    return this.prisma.companyBranch.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code ?? generateBusinessCode('BR'),
        location: dto.location,
        phone: dto.phone,
        email: dto.email,
        isHeadquarter: dto.isHeadquarter ?? false,
      },
    });
  }

  async updateBranch(id: string, dto: UpdateCompanyBranchDto) {
    await this.ensureExists('companyBranch', id);
    return this.prisma.companyBranch.update({ where: { id }, data: dto });
  }

  async removeBranch(id: string): Promise<void> {
    await this.softDelete('companyBranch', id, 'Branch');
  }

  // ── Departments ──────────────────────────────────────────────────────────

  async listDepartments(query: QueryOrgDto): Promise<Paginated<object>> {
    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
      companyId: await this.companyId(),
    };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, DEPARTMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.department.findMany({ where, skip, take, orderBy, include: EMPLOYEE_COUNT }),
      this.prisma.department.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getDepartment(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!department) throw new NotFoundException(`Department ${id} not found`);
    return department;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    const companyId = await this.companyId();
    return this.prisma.department.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code ?? generateBusinessCode('DPT'),
        headId: dto.headId,
      },
    });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.ensureExists('department', id);
    const { headId, ...rest } = dto;
    return this.prisma.department.update({
      where: { id },
      data: { ...rest, headId: headId === undefined ? undefined : headId },
    });
  }

  async removeDepartment(id: string): Promise<void> {
    await this.softDelete('department', id, 'Department');
  }

  // ── Positions ────────────────────────────────────────────────────────────

  async listPositions(query: QueryOrgDto): Promise<Paginated<object>> {
    const where: Prisma.PositionWhereInput = {
      deletedAt: null,
      companyId: await this.companyId(),
    };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, POSITION_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.position.findMany({ where, skip, take, orderBy, include: EMPLOYEE_COUNT }),
      this.prisma.position.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPosition(id: string) {
    const position = await this.prisma.position.findFirst({
      where: { id, deletedAt: null },
    });
    if (!position) throw new NotFoundException(`Position ${id} not found`);
    return position;
  }

  async createPosition(dto: CreatePositionDto) {
    const companyId = await this.companyId();
    return this.prisma.position.create({
      data: {
        companyId,
        title: dto.title,
        code: dto.code ?? generateBusinessCode('POS'),
        level: dto.level,
      },
    });
  }

  async updatePosition(id: string, dto: UpdatePositionDto) {
    await this.ensureExists('position', id);
    const { level, ...rest } = dto;
    return this.prisma.position.update({
      where: { id },
      data: { ...rest, level: level === undefined ? undefined : level },
    });
  }

  async removePosition(id: string): Promise<void> {
    await this.softDelete('position', id, 'Position');
  }

  // ── Command hierarchy chart ───────────────────────────────────────────────

  /**
   * The org tree for the command hierarchy: company → CEO → departments, each
   * with its head (employee) and the employees in it (with their reporting
   * line and position level). Rendered as the org chart in the admin console.
   */
  async chart() {
    const company = await this.prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!company) throw new NotFoundException('No company is configured — run the seed first.');

    // CEO = the employee holding the top executive position (level 1).
    const ceo = await this.prisma.employee.findFirst({
      where: {
        deletedAt: null,
        position: { level: 1 },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: { select: { title: true } },
      },
    });

    const departments = await this.prisma.department.findMany({
      where: { companyId: company.id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: { select: { title: true } },
          },
        },
        employees: {
          where: { deletedAt: null },
          orderBy: [{ position: { level: 'asc' } }, { lastName: 'asc' }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            reportsToId: true,
            position: { select: { title: true, level: true } },
          },
        },
      },
    });

    return { company: { id: company.id, name: company.name }, ceo, departments };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async ensureExists(
    model: 'companyBranch' | 'department' | 'position',
    id: string,
  ): Promise<void> {
    const exists = await (this.prisma[model] as unknown as OrgDelegate).findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Record ${id} not found`);
  }

  private async softDelete(
    model: 'companyBranch' | 'department' | 'position',
    id: string,
    label: string,
  ): Promise<void> {
    const result = await (this.prisma[model] as unknown as OrgDelegate).updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`${label} ${id} not found`);
  }
}
