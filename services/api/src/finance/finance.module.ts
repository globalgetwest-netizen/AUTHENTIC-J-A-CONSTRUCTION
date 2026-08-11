import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  ExpensesController,
  InvoicesController,
  PaymentsController,
  ReceiptsController,
  TransactionsController,
} from './finance.controller';
import { StaffExpensesController } from './staff-expenses.controller';
import { StaffInvoicesController, StaffReceiptsController } from './staff-receipts.controller';

@Module({
  controllers: [
    InvoicesController,
    ReceiptsController,
    ExpensesController,
    TransactionsController,
    PaymentsController,
    StaffExpensesController,
    StaffReceiptsController,
    StaffInvoicesController,
  ],
  providers: [FinanceService],
})
export class FinanceModule {}