import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { VerificationResult } from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { EmployeeIdsService } from './employee-ids.service';

type MockCrud = Record<
  'findFirst' | 'findMany' | 'count' | 'create' | 'update',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: EmployeeIdsService;
  employeeID: MockCrud;
  employee: MockCrud;
  employeeIDVerification: MockCrud;
} {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  });
  const employeeID = make();
  const employee = make();
  const employeeIDVerification = make();
  const prisma = {
    employeeID,
    employee,
    employeeIDVerification,
    $transaction: vi.fn((arg: unknown) =>
      typeof arg === 'function' ? arg(prisma) : Promise.resolve(arg),
    ),
  } as unknown as PrismaService;
  return { service: new EmployeeIdsService(prisma), employeeID, employee, employeeIDVerification };
}

const emp = {
  id: 'e1',
  employeeCode: 'EMP-1',
  firstName: 'Ama',
  lastName: 'Owusu',
  department: { name: 'Engineering' },
  position: { title: 'Engineer' },
  branch: { name: 'Head Office' },
};

describe('EmployeeIdsService', () => {
  it('issues a first VERIFIED card with a generated number and token', async () => {
    const { service, employeeID, employee } = makeService();
    employee.findFirst.mockResolvedValue({ id: 'e1', deletedAt: null });
    employeeID.findFirst.mockResolvedValue(null); // no live card
    employeeID.create.mockImplementation(({ data }) => Promise.resolve({ id: 'c1', ...data }));

    const card = await service.issue({ employeeId: 'e1' });

    expect(card).toMatchObject({ employeeId: 'e1', status: VerificationResult.VERIFIED });
    expect((card as { cardNumber: string }).cardNumber).toMatch(/^EID-/);
    expect((card as { qrToken: string }).qrToken).toBeTruthy();
    expect(employeeID.update).not.toHaveBeenCalled();
  });

  it('re-issuing an employee revokes the live card and links replacedById', async () => {
    const { service, employeeID, employee } = makeService();
    employee.findFirst.mockResolvedValue({ id: 'e1', deletedAt: null });
    employeeID.findFirst.mockResolvedValue({ id: 'old1', status: VerificationResult.VERIFIED });
    employeeID.update.mockResolvedValue({ id: 'old1', status: VerificationResult.REVOKED });
    employeeID.create.mockImplementation(async ({ data }) => ({ id: 'c2', ...data }));

    const card = await service.issue({ employeeId: 'e1' });

    expect(employeeID.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'old1' }, data: { status: VerificationResult.REVOKED } }),
    );
    expect((card as { replacedById: string }).replacedById).toBe('old1');
  });

  it('rejects issuing to a missing employee', async () => {
    const { service, employee } = makeService();
    employee.findFirst.mockResolvedValue(null);
    await expect(service.issue({ employeeId: 'nope' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('revokes an active card and is idempotent on an already-revoked card', async () => {
    const { service, employeeID } = makeService();
    employeeID.findFirst.mockResolvedValue({ id: 'c1', status: VerificationResult.VERIFIED });
    employeeID.update.mockResolvedValue({ id: 'c1', status: VerificationResult.REVOKED });

    const revoked = await service.revoke('c1');
    expect(revoked).toMatchObject({ status: VerificationResult.REVOKED });

    employeeID.findFirst.mockResolvedValue({ id: 'c1', status: VerificationResult.REVOKED });
    await service.revoke('c1');
    expect(employeeID.update).toHaveBeenCalledTimes(1);
  });

  it('verifies a live card with the correct token', async () => {
    const { service, employeeID, employeeIDVerification } = makeService();
    employeeID.findFirst.mockResolvedValue({
      id: 'c1',
      cardNumber: 'EID-1',
      employeeId: 'e1',
      qrToken: 'tok1',
      status: VerificationResult.VERIFIED,
      issuedAt: new Date('2026-01-01'),
      expiresAt: null,
      employee: emp,
    });

    const res = (await service.verify({ card: 'EID-1', t: 'tok1' }, '10.0.0.1')) as {
      result: VerificationResult;
      verified: boolean;
      employee: { name: string };
    };

    expect(res.result).toBe(VerificationResult.VERIFIED);
    expect(res.verified).toBe(true);
    expect(res.employee.name).toBe('Ama Owusu');
    expect(employeeIDVerification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cardNumber: 'EID-1',
          result: VerificationResult.VERIFIED,
          method: 'QR',
          ipAddress: '10.0.0.1',
        }),
      }),
    );
  });

  it('flags a wrong token as INVALID', async () => {
    const { service, employeeID } = makeService();
    employeeID.findFirst.mockResolvedValue({
      id: 'c1',
      cardNumber: 'EID-1',
      employeeId: 'e1',
      qrToken: 'tok1',
      status: VerificationResult.VERIFIED,
      issuedAt: new Date('2026-01-01'),
      expiresAt: null,
      employee: emp,
    });

    const res = await service.verify({ card: 'EID-1', t: 'wrong' });
    expect(res).toMatchObject({ result: VerificationResult.INVALID, verified: false });
  });

  it('flags a revoked card as REVOKED even with a matching token', async () => {
    const { service, employeeID } = makeService();
    employeeID.findFirst.mockResolvedValue({
      id: 'c1',
      cardNumber: 'EID-1',
      employeeId: 'e1',
      qrToken: 'tok1',
      status: VerificationResult.REVOKED,
      issuedAt: new Date('2026-01-01'),
      expiresAt: null,
      employee: emp,
    });

    const res = await service.verify({ card: 'EID-1', t: 'tok1' });
    expect(res).toMatchObject({ result: VerificationResult.REVOKED });
  });

  it('flags an expired card as EXPIRED', async () => {
    const { service, employeeID } = makeService();
    employeeID.findFirst.mockResolvedValue({
      id: 'c1',
      cardNumber: 'EID-1',
      employeeId: 'e1',
      qrToken: 'tok1',
      status: VerificationResult.VERIFIED,
      issuedAt: new Date('2020-01-01'),
      expiresAt: new Date('2020-02-01'),
      employee: emp,
    });

    const res = await service.verify({ card: 'EID-1', t: 'tok1' });
    expect(res).toMatchObject({ result: VerificationResult.EXPIRED });
  });

  it('flags an unknown card as INVALID without logging a scan row', async () => {
    const { service, employeeID, employeeIDVerification } = makeService();
    employeeID.findFirst.mockResolvedValue(null);

    const res = await service.verify({ card: 'NOPE', t: 'x' });
    expect(res).toMatchObject({ result: VerificationResult.INVALID, employee: null });
    // An unrecognised number has no `EmployeeID` row to attach a scan to — the
    // `cardNumber`/`employeeId` FKs are required, so nothing is persisted.
    expect(employeeIDVerification.create).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when fetching a missing card detail', async () => {
    const { service, employeeID } = makeService();
    employeeID.findFirst.mockResolvedValue(null);
    await expect(service.get('c1')).rejects.toBeInstanceOf(NotFoundException);
  });
});