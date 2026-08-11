import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { requireDepartmentCode, resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { QueryReceiptsDto } from './dto/receipt-query.dto';
import { QueryInvoicesDto } from './dto/invoice-query.dto';

/**
 * Staff portal — payments received (Finance cashier). Authenticated-only.
 * Recording a payment requires the Finance department; viewing is scoped to
 * the cashier's own receipts (or the whole book for the Finance head).
 */
@Controller('staff/receipts')
export class StaffReceiptsController {
  constructor(
    private readonly finance: FinanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryReceiptsDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.finance.listReceiptsForStaff(ctx, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateReceiptDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-FINANCE');
    return this.finance.createStaffReceipt(ctx, dto);
  }
}

/** Shared invoice catalogue — read by any staff member for the receipt form. */
@Controller('staff/invoices')
export class StaffInvoicesController {
  constructor(
    private readonly finance: FinanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryInvoicesDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.finance.listInvoices(query);
  }
}
