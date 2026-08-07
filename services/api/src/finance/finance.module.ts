import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  ExpensesController,
  InvoicesController,
  PaymentsController,
  ReceiptsController,
  TransactionsController,
} from './finance.controller';

@Module({
  controllers: [
    InvoicesController,
    ReceiptsController,
    ExpensesController,
    TransactionsController,
    PaymentsController,
  ],
  providers: [FinanceService],
})
export class FinanceModule {}