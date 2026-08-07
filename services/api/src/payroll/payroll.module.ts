import { Module } from '@nestjs/common';
import {
  PayrollPeriodsController,
  PayrollsController,
  PayslipsController,
  StaffPayslipsController,
} from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  controllers: [
    PayrollPeriodsController,
    PayrollsController,
    PayslipsController,
    StaffPayslipsController,
  ],
  providers: [PayrollService],
})
export class PayrollModule {}