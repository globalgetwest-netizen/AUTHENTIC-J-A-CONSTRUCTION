import { describe, expect, it } from 'vitest';
import {
  Prisma,
  PrismaClient,
  createPrismaClient,
  prisma,
  EmploymentType,
  ProjectStatus,
  PaymentMethod,
  LeadStage,
} from './index';

const isClient = (v: unknown): boolean =>
  typeof v === 'object' && v !== null && typeof (v as PrismaClient).$connect === 'function';

describe('prisma client factory', () => {
  it('constructs a client without connecting', () => {
    const client = createPrismaClient();
    expect(isClient(client)).toBe(true);
    expect(typeof client.$disconnect).toBe('function');
  });

  it('accepts a URL override and log levels', () => {
    const client = createPrismaClient({
      url: 'postgresql://ajac:ajac_dev_password@localhost:5432/ajac?schema=public',
      log: ['error'],
    });
    expect(isClient(client)).toBe(true);
  });

  it('exposes a stable dev singleton', () => {
    expect(isClient(prisma)).toBe(true);
    expect(prisma).toBe(prisma);
  });
});

describe('generated enums', () => {
  it('mirrors the schema employment types', () => {
    expect(EmploymentType.FULL_TIME).toBe('FULL_TIME');
    expect(EmploymentType.PROBATION).toBe('PROBATION');
  });

  it('mirrors the schema project statuses', () => {
    expect(ProjectStatus.PLANNING).toBe('PLANNING');
    expect(ProjectStatus.COMPLETED).toBe('COMPLETED');
  });

  it('mirrors payment and lead stages', () => {
    expect(PaymentMethod.MOBILE_MONEY).toBe('MOBILE_MONEY');
    expect(LeadStage.WON).toBe('WON');
  });

  it('exposes every registered model name', () => {
    expect(Prisma.ModelName.Project).toBe('Project');
    expect(Prisma.ModelName.Employee).toBe('Employee');
    expect(Prisma.ModelName.Property).toBe('Property');
    expect(Prisma.ModelName.LandAllocation).toBe('LandAllocation');
    expect(Prisma.ModelName.Invoice).toBe('Invoice');
  });
});
