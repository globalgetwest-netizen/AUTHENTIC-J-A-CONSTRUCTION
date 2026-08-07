import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { PayrollService } from './payroll.service';
import { QueryPayrollPeriodsDto } from './dto/payroll-period-query.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { QueryPayrollsDto } from './dto/payroll-query.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { QueryPayslipsDto } from './dto/payslip-query.dto';

@Controller('payroll-periods')
export class PayrollPeriodsController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @RequirePermissions('payroll.read')
  list(@Query() query: QueryPayrollPeriodsDto) {
    return this.service.listPeriods(query);
  }

  @Get(':id')
  @RequirePermissions('payroll.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPeriod(id);
  }

  @Post()
  @RequirePermissions('payroll.write')
  create(@Body() dto: CreatePayrollPeriodDto) {
    return this.service.createPeriod(dto);
  }

  @Post(':id/generate')
  @RequirePermissions('payroll.write')
  generate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.generateRunsForPeriod(id);
  }

  @Post(':id/process')
  @RequirePermissions('payroll.write')
  process(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.processPeriod(id, user);
  }

  @Post(':id/issue-payslips')
  @RequirePermissions('payroll.write')
  issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.issuePayslips(id);
  }

  @Patch(':id')
  @RequirePermissions('payroll.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayrollPeriodDto) {
    return this.service.updatePeriod(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('payroll.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removePeriod(id);
  }
}

@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @RequirePermissions('payroll.read')
  list(@Query() query: QueryPayrollsDto) {
    return this.service.listPayrolls(query);
  }

  @Get(':id')
  @RequirePermissions('payroll.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPayroll(id);
  }

  @Patch(':id')
  @RequirePermissions('payroll.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayrollDto) {
    return this.service.updatePayroll(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('payroll.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removePayroll(id);
  }
}

@Controller('payslips')
export class PayslipsController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @RequirePermissions('payroll.read')
  list(@Query() query: QueryPayslipsDto) {
    return this.service.listPayslips(query);
  }

  @Get(':id')
  @RequirePermissions('payroll.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPayslip(id);
  }

  @Delete(':id')
  @RequirePermissions('payroll.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removePayslip(id);
  }
}

@Controller('staff/payslips')
export class StaffPayslipsController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listForStaff(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getForStaff(id, user);
  }
}