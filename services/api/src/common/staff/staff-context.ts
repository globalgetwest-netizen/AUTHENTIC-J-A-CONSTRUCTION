import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The scoping context for a logged-in staff member, resolved from their linked
 * Employee record. Drives every department-scoped staff endpoint:
 *
 * - `employeeId` — the caller's Employee id.
 * - `departmentId` — the department they work in (null if unassigned).
 * - `departmentCode` — the department's business code (e.g. `DPT-STORES`),
 *   used to gate operational writes to the right department.
 * - `isHead` — true when the caller is the department's head (`Department.headId`),
 *   i.e. they may see the whole department's work and approve PENDING records.
 *
 * Regular staff see their own records (`createdById = userId`); department
 * heads see their department's records (`departmentId = theirs`).
 */
export interface StaffContext {
  userId: string;
  employeeId: string;
  departmentId: string | null;
  departmentCode: string | null;
  isHead: boolean;
}

/** Guards a department-scoped write: only staff in the given department may act. */
export function requireDepartmentCode(ctx: StaffContext, code: string): void {
  if (ctx.departmentCode !== code) {
    throw new ForbiddenException(`This action is available to the ${code} department only`);
  }
}

export async function resolveStaffContext(
  prisma: PrismaService,
  userId: string,
): Promise<StaffContext> {
  const employee = await prisma.employee.findFirst({
    where: { userId, deletedAt: null },
    include: { department: { select: { id: true, code: true, headId: true } } },
  });
  if (!employee) {
    throw new ForbiddenException('No employee profile is linked to this account');
  }
  const departmentId = employee.departmentId ?? employee.department?.id ?? null;
  return {
    userId,
    employeeId: employee.id,
    departmentId,
    departmentCode: employee.department?.code ?? null,
    isHead: departmentId !== null && employee.department?.headId === employee.id,
  };
}
