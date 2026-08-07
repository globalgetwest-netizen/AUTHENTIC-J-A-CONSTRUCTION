import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PayrollStatus } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { PayrollService } from './payroll.service';
import type { AuthUser } from '../common/auth/auth-user.type';

type MockCrud = Record<
  'findFirst' | 'findUnique' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany' | 'delete',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: PayrollService;
  period: MockCrud;
  payroll: MockCrud;
  payslip: MockCrud;
  employee: MockCrud;
} {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
  });
  const period = make();
  const payroll = make();
  const payslip = make();
  const employee = make();
  const prisma = {
    payrollPeriod: period,
    payroll,
    payslip,
    employee,
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaService;
  return { service: new PayrollService(prisma), period, payroll, payslip, employee };
}

const staff: AuthUser = { id: 'u1', email: 'staff@x.com', firstName: 'Ama', lastName: 'Owusu', isActive: true, roles: ['STAFF'], permissions: [] };

describe('PayrollService', () => {
  it('creates a period and rejects inverted dates', async () => {
    const { service, period } = makeService();
    period.create.mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data }));
    const created = await service.createPeriod({ name: 'Sept 2026', startDate: '2026-09-01', endDate: '2026-09-30' });
    expect(created).toMatchObject({ name: 'Sept 2026' });

    await expect(
      service.createPeriod({ name: 'bad', startDate: '2026-10-01', endDate: '2026-09-30' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates one draft payrun per active salaried employee not yet covered', async () => {
    const { service, period, payroll, employee } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.DRAFT });
    employee.findMany.mockResolvedValue([{ id: 'e1', salary: 4500 }, { id: 'e2', salary: 2000 }]);
    payroll.findMany.mockResolvedValue([{ employeeId: 'e1' }]);
    payroll.create.mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data }));

    const result = await service.generateRunsForPeriod('p1');

    expect(result.created).toBe(1);
    const created = (payroll.create.mock.calls[0] ?? [[]])[0] as {
      data: { employeeId: string; grossPay: { toNumber(): number }; netPay: { toNumber(): number }; deductions: { total: number } };
    };
    expect(created.data.employeeId).toBe('e2');
    expect(created.data.grossPay.toNumber()).toBe(2000);
    // statutory: SSNIT 5.5% + PAYE; net < gross
    expect(created.data.netPay.toNumber()).toBeLessThan(2000);
    expect(created.data.deductions.total).toBeGreaterThan(0);
  });

  it('does not create runs for employees without a salary', async () => {
    const { service, period, employee, payroll } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.DRAFT });
    // the where clause excludes null salaries, so the engine only sees salaried staff
    employee.findMany.mockResolvedValue([]);
    payroll.findMany.mockResolvedValue([]);
    const result = await service.generateRunsForPeriod('p1');
    expect(result.created).toBe(0);
    expect(employee.findMany.mock.calls[0]![0].where.salary).toEqual({ not: null });
  });

  it('refuses to generate runs once a period is not draft', async () => {
    const { service, period } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.PROCESSED });
    await expect(service.generateRunsForPeriod('p1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('processes a period and stamps who/when on runs and the period', async () => {
    const { service, period, payroll } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.DRAFT });
    payroll.count.mockResolvedValue(3);
    const stamped = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(stamped);
    payroll.updateMany.mockResolvedValue({ count: 3 });
    period.update.mockResolvedValue({ id: 'p1', status: PayrollStatus.PROCESSED });

    const result = await service.processPeriod('p1', staff);

    expect(payroll.updateMany).toHaveBeenCalledWith({
      where: { periodId: 'p1', deletedAt: null },
      data: { status: PayrollStatus.PROCESSED, processedById: 'u1', processedAt: stamped },
    });
    expect(period.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: PayrollStatus.PROCESSED, closedAt: stamped },
    });
    expect(result).toEqual({ id: 'p1', status: PayrollStatus.PROCESSED });
    vi.useRealTimers();
  });

  it('refuses to process a period with no runs', async () => {
    const { service, period, payroll } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.DRAFT });
    payroll.count.mockResolvedValue(0);
    await expect(service.processPeriod('p1', staff)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('issues one PAID payslip per processed run not already covered', async () => {
    const { service, period, payroll, payslip } = makeService();
    period.findFirst.mockResolvedValue({ id: 'p1', status: PayrollStatus.PROCESSED });
    payroll.findMany.mockResolvedValue([
      { employeeId: 'e1', grossPay: 4500, deductions: { total: 812.6 }, netPay: 3687.4 },
      { employeeId: 'e2', grossPay: 2000, deductions: { total: 145.3 }, netPay: 1854.7 },
    ]);
    payslip.findMany.mockResolvedValue([{ employeeId: 'e1' }]);
    payslip.create.mockImplementation(({ data }) => Promise.resolve({ id: 's1', ...data }));

    const result = await service.issuePayslips('p1');

    expect(result.issued).toBe(1);
    const created = payslip.create.mock.calls[0]![0]!.data as {
      employeeId: string;
      payslipNo: string;
      status: PayrollStatus;
    };
    expect(created.employeeId).toBe('e2');
    expect(created.payslipNo).toMatch(/^PSL-/);
    expect(created.status).toBe(PayrollStatus.PAID);
  });

  it('recomputes net when a draft payrun gross is edited', async () => {
    const { service, payroll } = makeService();
    payroll.findFirst.mockResolvedValue({ id: 'r1', status: PayrollStatus.DRAFT, grossPay: 4500 });
    payroll.update.mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data }));

    const updated = (await service.updatePayroll('r1', { grossPay: 5000 })) as {
      grossPay: { toNumber(): number };
      netPay: { toNumber(): number };
      deductions: { ssnit: number };
    };

    expect(updated.grossPay.toNumber()).toBe(5000);
    expect(updated.netPay.toNumber()).toBeLessThan(5000);
    expect(updated.deductions.ssnit).toBeCloseTo(275, 2);
  });

  it('rejects editing a non-draft payrun', async () => {
    const { service, payroll } = makeService();
    payroll.findFirst.mockResolvedValue({ id: 'r1', status: PayrollStatus.PROCESSED });
    await expect(service.updatePayroll('r1', { grossPay: 5000 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('scopes staff payslips to the caller', async () => {
    const { service, employee, payslip } = makeService();
    employee.findFirst.mockResolvedValue({ id: 'e1' });
    payslip.findMany.mockResolvedValue([{ id: 's1', employeeId: 'e1' }]);
    const list = await service.listForStaff(staff);
    expect(list).toHaveLength(1);
    expect(payslip.findMany.mock.calls[0]![0].where.employeeId).toBe('e1');

    payslip.findFirst.mockResolvedValue(null);
    await expect(service.getForStaff('s9', staff)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft-deletes only draft payruns', async () => {
    const { service, payroll } = makeService();
    payroll.findFirst.mockResolvedValue({ id: 'r1', status: PayrollStatus.DRAFT });
    payroll.update.mockResolvedValue({ count: 1 });
    await service.removePayroll('r1');
    expect(payroll.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});