import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeStatus, PayrollStatus, Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { computePayroll, type DeductionLine } from './ghana-tax';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { QueryPayrollPeriodsDto } from './dto/payroll-period-query.dto';
import { QueryPayrollsDto } from './dto/payroll-query.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { QueryPayslipsDto } from './dto/payslip-query.dto';
import type { AuthUser } from '../common/auth/auth-user.type';

const PERIOD_SORTABLE = ['name', 'startDate', 'endDate', 'status', 'createdAt'] as const;
const PAYROLL_SORTABLE = ['grossPay', 'netPay', 'status', 'createdAt'] as const;
const PAYSLIP_SORTABLE = ['payslipNo', 'issuedAt', 'netPay', 'status', 'createdAt'] as const;

const EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  department: { select: { name: true } },
  position: { select: { title: true } },
} as const;

const PERIOD_INCLUDE = {
  payrolls: {
    include: { employee: { select: EMPLOYEE_SELECT } },
    orderBy: { createdAt: 'asc' as const },
  },
  payslips: {
    include: { employee: { select: EMPLOYEE_SELECT } },
    orderBy: { issuedAt: 'asc' as const },
  },
} as const;

const PAYROLL_INCLUDE = {
  period: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
  employee: { select: EMPLOYEE_SELECT },
} as const;

const PAYSLIP_INCLUDE = {
  period: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
  employee: { select: EMPLOYEE_SELECT },
} as const;

/** Shape stored in the `deductions` JSON column. */
export interface DeductionsJson {
  ssnit: number;
  paye: number;
  total: number;
  lines: DeductionLine[];
  employer: { ssnit: number; nhil: number };
}

function buildDeductionsJson(gross: number): DeductionsJson {
  const computed = computePayroll(gross);
  return {
    ssnit: computed.ssnitEmployee,
    paye: computed.paye,
    total: computed.totalDeductions,
    lines: computed.deductions,
    employer: computed.employerContributions,
  };
}

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Payroll periods ─────────────────────────────────────────────────────────

  async listPeriods(query: QueryPayrollPeriodsDto): Promise<Paginated<object>> {
    const where: Prisma.PayrollPeriodWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PERIOD_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.payrollPeriod.findMany({ where, skip, take, orderBy }),
      this.prisma.payrollPeriod.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPeriod(id: string): Promise<object> {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id },
      include: PERIOD_INCLUDE,
    });
    if (!period) throw new NotFoundException(`Payroll period ${id} not found`);
    return period;
  }

  async createPeriod(dto: CreatePayrollPeriodDto): Promise<object> {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    return this.prisma.payrollPeriod.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async updatePeriod(id: string, dto: UpdatePayrollPeriodDto): Promise<object> {
    await this.ensurePeriod(id);
    const data: Prisma.PayrollPeriodUncheckedUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate < data.startDate
    ) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    return this.prisma.payrollPeriod.update({ where: { id }, data });
  }

  async removePeriod(id: string): Promise<void> {
    const period = await this.ensurePeriod(id);
    const runs = await this.prisma.payroll.count({ where: { periodId: id } });
    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payroll periods can be deleted');
    }
    if (runs > 0) {
      throw new BadRequestException('Delete the payruns first before removing the period');
    }
    await this.prisma.payrollPeriod.delete({ where: { id } });
  }

  /**
   * Generates one DRAFT payrun per ACTIVE salaried employee who does not yet
   * have a run in this period. Statutory deductions + net are computed
   * server-side from the employee's stored salary.
   */
  async generateRunsForPeriod(id: string): Promise<{ created: number }> {
    const period = await this.ensurePeriod(id);
    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Payruns can only be generated while the period is draft');
    }

    const [employees, existing] = await Promise.all([
      this.prisma.employee.findMany({
        where: { status: EmployeeStatus.ACTIVE, deletedAt: null, salary: { not: null } },
        select: { id: true, salary: true },
      }),
      this.prisma.payroll.findMany({
        where: { periodId: id, deletedAt: null },
        select: { employeeId: true },
      }),
    ]);

    const covered = new Set(existing.map((run) => run.employeeId));
    const toCreate = employees.filter((employee) => !covered.has(employee.id));

    for (const employee of toCreate) {
      const gross = Number(employee.salary);
      const deductions = buildDeductionsJson(gross);
      await this.prisma.payroll.create({
        data: {
          periodId: id,
          employeeId: employee.id,
          grossPay: new Prisma.Decimal(gross),
          deductions: deductions as unknown as Prisma.InputJsonValue,
          netPay: new Prisma.Decimal(computePayroll(gross).net),
        },
      });
    }

    return { created: toCreate.length };
  }

  /** Marks the period and every payrun PROCESSED, stamping who/when. */
  async processPeriod(id: string, user: AuthUser): Promise<object> {
    const period = await this.ensurePeriod(id);
    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft periods can be processed');
    }
    const runs = await this.prisma.payroll.count({ where: { periodId: id, deletedAt: null } });
    if (runs === 0) {
      throw new BadRequestException('Generate payruns before processing the period');
    }
    const stamp = new Date();
    const [, updated] = await this.prisma.$transaction([
      this.prisma.payroll.updateMany({
        where: { periodId: id, deletedAt: null },
        data: { status: PayrollStatus.PROCESSED, processedById: user.id, processedAt: stamp },
      }),
      this.prisma.payrollPeriod.update({
        where: { id },
        data: { status: PayrollStatus.PROCESSED, closedAt: stamp },
      }),
    ]);
    return updated;
  }

  /** Creates one issued Payslip per PROCESSED payrun in the period. */
  async issuePayslips(id: string): Promise<{ issued: number }> {
    const period = await this.ensurePeriod(id);
    if (period.status === PayrollStatus.DRAFT) {
      throw new BadRequestException('Process the period before issuing payslips');
    }

    const [runs, existing] = await Promise.all([
      this.prisma.payroll.findMany({
        where: { periodId: id, deletedAt: null, status: { not: PayrollStatus.CANCELLED } },
        select: {
          employeeId: true,
          grossPay: true,
          deductions: true,
          netPay: true,
        },
      }),
      this.prisma.payslip.findMany({
        where: { periodId: id },
        select: { employeeId: true },
      }),
    ]);

    const covered = new Set(existing.map((slip) => slip.employeeId));
    const toIssue = runs.filter((run) => !covered.has(run.employeeId));

    for (const run of toIssue) {
      await this.prisma.payslip.create({
        data: {
          employeeId: run.employeeId,
          periodId: id,
          payslipNo: generateBusinessCode('PSL'),
          grossPay: run.grossPay,
          deductions: (run.deductions ?? null) as unknown as Prisma.InputJsonValue,
          netPay: run.netPay,
          status: PayrollStatus.PAID,
          issuedAt: new Date(),
        },
      });
    }

    if (toIssue.length > 0 && period.status !== PayrollStatus.PAID) {
      await this.prisma.payrollPeriod.update({
        where: { id },
        data: { status: PayrollStatus.PAID },
      });
    }

    return { issued: toIssue.length };
  }

  // ── Payroll runs ────────────────────────────────────────────────────────────

  async listPayrolls(query: QueryPayrollsDto): Promise<Paginated<object>> {
    const where: Prisma.PayrollWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.periodId) where.periodId = query.periodId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.search) {
      where.OR = [
        { employee: { is: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { employee: { is: { lastName: { contains: query.search, mode: 'insensitive' } } } },
        { employee: { is: { employeeCode: { contains: query.search, mode: 'insensitive' } } } },
        { period: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PAYROLL_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.payroll.findMany({ where, skip, take, orderBy, include: PAYROLL_INCLUDE }),
      this.prisma.payroll.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPayroll(id: string): Promise<object> {
    const run = await this.prisma.payroll.findFirst({
      where: { id, deletedAt: null },
      include: PAYROLL_INCLUDE,
    });
    if (!run) throw new NotFoundException(`Payroll ${id} not found`);
    return run;
  }

  async updatePayroll(id: string, dto: UpdatePayrollDto): Promise<object> {
    const run = await this.prisma.payroll.findFirst({ where: { id, deletedAt: null } });
    if (!run) throw new NotFoundException(`Payroll ${id} not found`);
    if (run.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payruns can be edited');
    }

    const gross = dto.grossPay !== undefined ? Number(dto.grossPay) : Number(run.grossPay);
    const computed = computePayroll(gross);
    return this.prisma.payroll.update({
      where: { id },
      data: {
        grossPay: new Prisma.Decimal(computed.gross),
        deductions: buildDeductionsJson(gross) as unknown as Prisma.InputJsonValue,
        netPay: new Prisma.Decimal(computed.net),
      },
      include: PAYROLL_INCLUDE,
    });
  }

  async removePayroll(id: string): Promise<void> {
    const run = await this.prisma.payroll.findFirst({ where: { id, deletedAt: null } });
    if (!run) throw new NotFoundException(`Payroll ${id} not found`);
    if (run.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payruns can be removed');
    }
    await this.prisma.payroll.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Payslips ────────────────────────────────────────────────────────────────

  async listPayslips(query: QueryPayslipsDto): Promise<Paginated<object>> {
    const where: Prisma.PayslipWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.periodId) where.periodId = query.periodId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.search) {
      where.OR = [
        { payslipNo: { contains: query.search, mode: 'insensitive' } },
        { employee: { is: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { employee: { is: { lastName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PAYSLIP_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.payslip.findMany({ where, skip, take, orderBy, include: PAYSLIP_INCLUDE }),
      this.prisma.payslip.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPayslip(id: string): Promise<object> {
    const slip = await this.prisma.payslip.findFirst({ where: { id }, include: PAYSLIP_INCLUDE });
    if (!slip) throw new NotFoundException(`Payslip ${id} not found`);
    return slip;
  }

  async removePayslip(id: string): Promise<void> {
    const result = await this.prisma.payslip.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Payslip ${id} not found`);
  }

  // ── Staff self-scoped ───────────────────────────────────────────────────────

  async listForStaff(user: AuthUser): Promise<object[]> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return [];
    return this.prisma.payslip.findMany({
      where: { employeeId: employee.id },
      include: PAYSLIP_INCLUDE,
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getForStaff(id: string, user: AuthUser): Promise<object> {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    const slip = await this.prisma.payslip.findFirst({
      where: { id, ...(employee ? { employeeId: employee.id } : { employeeId: '' }) },
      include: PAYSLIP_INCLUDE,
    });
    if (!slip) throw new NotFoundException(`Payslip ${id} not found`);
    return slip;
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  private async ensurePeriod(id: string): Promise<{ id: string; status: PayrollStatus }> {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id },
      select: { id: true, status: true },
    });
    if (!period) throw new NotFoundException(`Payroll period ${id} not found`);
    return period;
  }
}