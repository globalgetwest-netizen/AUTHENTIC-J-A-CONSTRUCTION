import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpensesDto } from './dto/expense-query.dto';

/**
 * Staff portal — departmental expenses. Authenticated-only (no permission
 * codes): every route resolves the caller's staff context and scopes inside
 * FinanceService, so no staff member can read or approve outside their remit.
 *
 * - Regular staff: see the expenses they raised; raise new ones (always PENDING).
 * - Department head: sees the department's whole expense ledger and approves.
 * - An administrator (finance.write) may also approve via this route.
 */
@Controller('staff/expenses')
export class StaffExpensesController {
  constructor(
    private readonly finance: FinanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryExpensesDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.finance.listExpensesForStaff(ctx, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.finance.createStaffExpense(ctx, dto);
  }

  @Post(':id/approve')
  async approve(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.finance.approveStaffExpense(ctx, user, id);
  }
}
