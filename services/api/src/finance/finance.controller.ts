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
import { FinanceService } from './finance.service';
import { QueryInvoicesDto } from './dto/invoice-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryReceiptsDto } from './dto/receipt-query.dto';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { QueryExpensesDto } from './dto/expense-query.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryTransactionsDto } from './dto/transaction-query.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryPaymentsDto } from './dto/payment-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @RequirePermissions('finance.read')
  list(@Query() query: QueryInvoicesDto) {
    return this.service.listInvoices(query);
  }

  @Get(':id')
  @RequirePermissions('finance.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getInvoice(id);
  }

  @Post()
  @RequirePermissions('finance.write')
  create(@Body() dto: CreateInvoiceDto) {
    return this.service.createInvoice(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInvoiceDto) {
    return this.service.updateInvoice(id, dto);
  }

  @Post(':id/items')
  @RequirePermissions('finance.write')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { description: string; quantity: number; unitPrice: number },
  ) {
    return this.service.addInvoiceItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('finance.write')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.service.removeInvoiceItems(id, itemId);
  }

  @Delete(':id')
  @RequirePermissions('finance.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeInvoice(id);
  }
}

@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @RequirePermissions('finance.read')
  list(@Query() query: QueryReceiptsDto) {
    return this.service.listReceipts(query);
  }

  @Get(':id')
  @RequirePermissions('finance.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getReceipt(id);
  }

  @Post()
  @RequirePermissions('finance.write')
  create(@Body() dto: CreateReceiptDto) {
    return this.service.createReceipt(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReceiptDto) {
    return this.service.updateReceipt(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeReceipt(id);
  }
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @RequirePermissions('finance.read')
  list(@Query() query: QueryExpensesDto) {
    return this.service.listExpenses(query);
  }

  @Get(':id')
  @RequirePermissions('finance.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getExpense(id);
  }

  @Post()
  @RequirePermissions('finance.write')
  create(@Body() dto: CreateExpenseDto) {
    return this.service.createExpense(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.updateExpense(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeExpense(id);
  }
}

@Controller('financial-transactions')
export class TransactionsController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @RequirePermissions('finance.read')
  list(@Query() query: QueryTransactionsDto) {
    return this.service.listTransactions(query);
  }

  @Get(':id')
  @RequirePermissions('finance.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getTransaction(id);
  }

  @Post()
  @RequirePermissions('finance.write')
  create(@Body() dto: CreateTransactionDto) {
    return this.service.createTransaction(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransactionDto) {
    return this.service.updateTransaction(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeTransaction(id);
  }
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @RequirePermissions('finance.read')
  list(@Query() query: QueryPaymentsDto) {
    return this.service.listPayments(query);
  }

  @Get(':id')
  @RequirePermissions('finance.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPayment(id);
  }

  @Post()
  @RequirePermissions('finance.write')
  create(@Body() dto: CreatePaymentDto) {
    return this.service.createPayment(dto);
  }

  @Patch(':id')
  @RequirePermissions('finance.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.service.updatePayment(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('finance.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removePayment(id);
  }
}