import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Expense,
  type FinancialTransaction,
  type Invoice,
  type PaymentRecord,
  type Receipt,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
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
import type { AuthUser } from '../common/auth/auth-user.type';
import type { StaffContext } from '../common/staff/staff-context';

const INVOICE_SORTABLE = ['createdAt', 'invoiceNo', 'total', 'issueOn', 'dueOn', 'status'] as const;
const INVOICE_INCLUDE = {
  client: { select: { id: true, companyName: true, contactName: true, clientCode: true } },
  project: { select: { id: true, name: true, code: true } },
  items: { orderBy: { createdAt: 'asc' as const } },
} as const;

const RECEIPT_SORTABLE = ['receivedOn', 'amount', 'receiptNo', 'createdAt'] as const;
const RECEIPT_INCLUDE = {
  client: { select: { id: true, companyName: true, contactName: true } },
  invoice: { select: { id: true, invoiceNo: true } },
} as const;

const EXPENSE_SORTABLE = ['incurredOn', 'amount', 'category', 'status', 'expenseNo', 'createdAt'] as const;
const EXPENSE_INCLUDE = {
  project: { select: { id: true, name: true, code: true } },
} as const;

/** Expense include for the staff portal — who raised it, who approved, and for which department. */
const STAFF_EXPENSE_INCLUDE = {
  ...EXPENSE_INCLUDE,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  department: { select: { id: true, name: true, code: true } },
} as const;

/** Receipt include for the staff portal — which cashier (employee) recorded the payment. */
const STAFF_RECEIPT_INCLUDE = {
  ...RECEIPT_INCLUDE,
  receivedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

const TXN_SORTABLE = ['occurredOn', 'amount', 'type', 'status', 'createdAt'] as const;

const PAYMENT_SORTABLE = ['paidOn', 'amount', 'status', 'createdAt'] as const;

function asNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === '' ? null : value;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Invoices ───────────────────────────────────────────────────────────────

  async listInvoices(query: QueryInvoicesDto): Promise<Paginated<object>> {
    const where: Prisma.InvoiceWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = query.clientId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) {
      where.OR = [
        { invoiceNo: { contains: query.search, mode: 'insensitive' } },
        { client: { is: { companyName: { contains: query.search, mode: 'insensitive' } } } },
        { client: { is: { contactName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, INVOICE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, skip, take, orderBy, include: INVOICE_INCLUDE }),
      this.prisma.invoice.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getInvoice(id: string): Promise<object> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  /** Creates an invoice with line items; totals are computed server-side. */
  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    await this.ensureClient(dto.clientId);
    const items = dto.items ?? [];
    const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const tax = dto.tax ?? 0;
    const discount = dto.discount ?? 0;
    const total = subtotal + tax - discount;
    return this.prisma.invoice.create({
      data: {
        invoiceNo: generateBusinessCode('INV'),
        clientId: dto.clientId,
        projectId: dto.projectId ? dto.projectId : undefined,
        issuedOn: dto.issuedOn ? new Date(dto.issuedOn) : new Date(),
        dueOn: new Date(dto.dueOn ?? dto.issuedOn ?? new Date().toISOString()),
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(subtotal === 0 ? 0 : tax),
        discount: new Prisma.Decimal(subtotal === 0 ? 0 : discount),
        total: new Prisma.Decimal(total),
        currency: dto.currency ?? 'GHS',
        status: dto.status ?? InvoiceStatus.DRAFT,
        notes: asNullable(dto.notes),
        items: {
          create: items.map((it) => ({
            description: it.description,
            quantity: new Prisma.Decimal(it.quantity),
            unitPrice: new Prisma.Decimal(it.unitPrice),
            amount: new Prisma.Decimal(Number(it.quantity) * Number(it.unitPrice)),
          })),
        },
      },
      include: INVOICE_INCLUDE,
    });
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const current = await this.ensureInvoice(id);
    const data: Prisma.InvoiceUncheckedUpdateInput = {
      projectId: dto.projectId !== undefined ? dto.projectId : undefined,
      dueOn: dto.dueOn ? new Date(dto.dueOn) : undefined,
      currency: dto.currency,
      status: dto.status,
      notes: dto.notes !== undefined ? asNullable(dto.notes) : undefined,
    };
    if (dto.tax !== undefined || dto.discount !== undefined) {
      const items = await this.prisma.invoiceItem.findMany({
        where: { invoiceId: id },
        select: { quantity: true, unitPrice: true },
      });
      const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
      const tax = dto.tax ?? Number(current.tax);
      const discount = dto.discount ?? Number(current.discount);
      data.subtotal = new Prisma.Decimal(subtotal);
      data.tax = new Prisma.Decimal(tax);
      data.discount = new Prisma.Decimal(discount);
      data.total = new Prisma.Decimal(subtotal + tax - discount);
    }
    const updated = await this.prisma.invoice.update({ where: { id }, data, include: INVOICE_INCLUDE });
    // If there are receipts, reconcile the invoice's payment status against them.
    await this.reconcileInvoiceStatus(id);
    return updated;
  }

  /** Appends a line item to an invoice and recomputes its totals (DRAFT/SENT only). */
  async addInvoiceItem(invoiceId: string, data: { description: string; quantity: number; unitPrice: number }): Promise<Invoice> {
    const current = await this.ensureInvoice(invoiceId);
    if (current.status !== InvoiceStatus.DRAFT && current.status !== InvoiceStatus.SENT) {
      throw new NotFoundException(`Invoice ${invoiceId} is no longer editable`);
    }
    await this.prisma.invoiceItem.create({
      data: {
        invoiceId,
        description: data.description,
        quantity: new Prisma.Decimal(data.quantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        amount: new Prisma.Decimal(Number(data.quantity) * Number(data.unitPrice)),
      },
    });
    return this.refreshTotals(invoiceId);
  }

  async removeInvoiceItems(invoiceId: string, itemId: string): Promise<Invoice> {
    await this.ensureInvoice(invoiceId);
    const result = await this.prisma.invoiceItem.deleteMany({ where: { id: itemId, invoiceId } });
    if (result.count === 0) throw new NotFoundException(`Invoice item ${itemId} not found`);
    return this.refreshTotals(invoiceId);
  }

  async removeInvoice(id: string): Promise<void> {
    const result = await this.prisma.invoice.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Invoice ${id} not found`);
  }

  private async refreshTotals(invoiceId: string): Promise<Invoice> {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoiceId },
      select: { quantity: true, unitPrice: true },
    });
    const current = await this.ensureInvoice(invoiceId);
    const subtotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const tax = Number(current.tax);
    const discount = Number(current.discount);
    const data: Prisma.InvoiceUncheckedUpdateInput = {
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(subtotal + tax - discount),
    };
    const updated = await this.prisma.invoice.update({ where: { id: invoiceId }, data, include: INVOICE_INCLUDE });
    await this.reconcileInvoiceStatus(invoiceId);
    return updated;
  }

  // ── Receipts (payments received against invoices) ─────────────────────────

  async listReceipts(query: QueryReceiptsDto): Promise<Paginated<object>> {
    const where: Prisma.ReceiptWhereInput = {};
    if (query.clientId) where.clientId = query.clientId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.search) {
      where.OR = [
        { receiptNo: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, RECEIPT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.receipt.findMany({ where, skip, take, orderBy, include: RECEIPT_INCLUDE }),
      this.prisma.receipt.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getReceipt(id: string): Promise<Receipt> {
    const receipt = await this.prisma.receipt.findFirst({ where: { id }, include: RECEIPT_INCLUDE });
    if (!receipt) throw new NotFoundException(`Receipt ${id} not found`);
    return receipt;
  }

  /** Records money received; when it references an invoice, the invoice status is re-derived. */
  async createReceipt(dto: CreateReceiptDto): Promise<Receipt> {
    await this.ensureClient(dto.clientId);
    const receipt = await this.prisma.receipt.create({
      data: {
        receiptNo: generateBusinessCode('RCP'),
        invoiceId: dto.invoiceId ?? null,
        clientId: dto.clientId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method ?? PaymentMethod.BANK_TRANSFER,
        reference: asNullable(dto.reference),
        notes: asNullable(dto.notes),
        receivedById: dto.receivedById ?? null,
      },
      include: RECEIPT_INCLUDE,
    });
    if (dto.invoiceId) await this.reconcileInvoiceStatus(dto.invoiceId);
    return receipt;
  }

  // ── Staff portal: payments received (Finance cashier) ──────────────────────

  /**
   * Receipts scoped to the caller: regular staff see the payments they received;
   * a department head (the Finance head) sees the department's full receipt book.
   */
  async listReceiptsForStaff(ctx: StaffContext, query: QueryReceiptsDto): Promise<Paginated<object>> {
    const where: Prisma.ReceiptWhereInput = {};
    if (!ctx.isHead) where.receivedById = ctx.employeeId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;
    if (query.method) where.method = query.method;
    if (query.search) {
      where.OR = [
        { receiptNo: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, RECEIPT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.receipt.findMany({ where, skip, take, orderBy, include: STAFF_RECEIPT_INCLUDE }),
      this.prisma.receipt.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  /**
   * Records a payment received by the Finance cashier. The caller's employee is
   * recorded as `receivedById`, so the receipt book stays attributed.
   */
  async createStaffReceipt(ctx: StaffContext, dto: CreateReceiptDto): Promise<Receipt> {
    await this.ensureClient(dto.clientId);
    const receipt = await this.prisma.receipt.create({
      data: {
        receiptNo: generateBusinessCode('RCP'),
        invoiceId: dto.invoiceId ?? null,
        clientId: dto.clientId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method ?? PaymentMethod.BANK_TRANSFER,
        reference: asNullable(dto.reference),
        notes: asNullable(dto.notes),
        receivedById: ctx.employeeId,
      },
      include: STAFF_RECEIPT_INCLUDE,
    });
    if (dto.invoiceId) await this.reconcileInvoiceStatus(dto.invoiceId);
    return receipt;
  }

  async updateReceipt(id: string, dto: UpdateReceiptDto): Promise<Receipt> {
    const current = await this.ensureReceipt(id);
    const data: Prisma.ReceiptUncheckedUpdateInput = {
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      method: dto.method,
      reference: dto.reference !== undefined ? asNullable(dto.reference) : undefined,
      notes: dto.notes !== undefined ? asNullable(dto.notes) : undefined,
    };
    const updated = await this.prisma.receipt.update({ where: { id }, data, include: RECEIPT_INCLUDE });
    if (current.invoiceId) await this.reconcileInvoiceStatus(current.invoiceId);
    if (updated.invoiceId && updated.invoiceId !== current.invoiceId) {
      await this.reconcileInvoiceStatus(updated.invoiceId);
    }
    return updated;
  }

  async removeReceipt(id: string): Promise<void> {
    const current = await this.ensureReceipt(id);
    await this.prisma.receipt.delete({ where: { id } });
    if (current.invoiceId) await this.reconcileInvoiceStatus(current.invoiceId);
  }

  private async ensureReceipt(id: string): Promise<{ id: string; invoiceId: string | null }> {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id },
      select: { id: true, invoiceId: true },
    });
    if (!receipt) throw new NotFoundException(`Receipt ${id} not found`);
    return receipt;
  }

  /**
   * Re-derives an invoice's payment status from its linked receipts:
   * all of its amount is covered → PAID; part → PART_PAID; none → PENDING.
   */
  private async reconcileInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      select: { total: true, status: true },
    });
    if (!invoice) return;
    if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.VOID) return;
    const agg = await this.prisma.receipt.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });
    const received = Number(agg._sum?.amount ?? 0);
    const total = Number(invoice.total);
    const next: InvoiceStatus =
      received >= total && total > 0
        ? InvoiceStatus.PAID
        : received > 0
          ? InvoiceStatus.PART_PAID
          : InvoiceStatus.SENT;
    if (next !== invoice.status) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: next, paidOn: next === InvoiceStatus.PAID ? new Date() : null },
      });
    }
  }

  // ── Expenses ───────────────────────────────────────────────────────────────

  async listExpenses(query: QueryExpensesDto): Promise<Paginated<object>> {
    const where: Prisma.ExpenseWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status as ExpenseStatus;
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) {
      where.OR = [
        { expenseNo: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, EXPENSE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({ where, skip, take, orderBy, include: EXPENSE_INCLUDE }),
      this.prisma.expense.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async createExpense(dto: CreateExpenseDto): Promise<Expense> {
    return this.prisma.expense.create({
      data: {
        expenseNo: generateBusinessCode('EXP'),
        category: dto.category,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        incurredOn: dto.incurredOn ? new Date(dto.incurredOn) : new Date(),
        paidById: dto.paidById ?? null,
        approvedById: dto.approvedById ?? null,
        receiptUrl: asNullable(dto.receiptUrl),
        projectId: dto.projectId ?? null,
        status: dto.status ? (dto.status as ExpenseStatus) : ExpenseStatus.PENDING,
      },
      include: EXPENSE_INCLUDE,
    });
  }

  // ── Staff portal: departmental expenses ─────────────────────────────────────

  /**
   * Expenses scoped to the caller: regular staff see the expenses they raised;
   * a department head sees their department's whole ledger (including PENDING
   * work awaiting their approval).
   */
  async listExpensesForStaff(ctx: StaffContext, query: QueryExpensesDto): Promise<Paginated<object>> {
    const where: Prisma.ExpenseWhereInput = {};
    if (ctx.isHead && ctx.departmentId) {
      where.departmentId = ctx.departmentId;
    } else {
      where.createdById = ctx.userId;
    }
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status as ExpenseStatus;
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) {
      where.OR = [
        { expenseNo: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, EXPENSE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({ where, skip, take, orderBy, include: STAFF_EXPENSE_INCLUDE }),
      this.prisma.expense.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  /**
   * Staff raise an expense for their department. Always recorded as PENDING —
   * staff can never self-approve — and attributed to the caller and their
   * department so the head sees it on their work list.
   */
  async createStaffExpense(ctx: StaffContext, dto: CreateExpenseDto): Promise<Expense> {
    return this.prisma.expense.create({
      data: {
        expenseNo: generateBusinessCode('EXP'),
        category: dto.category,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        incurredOn: dto.incurredOn ? new Date(dto.incurredOn) : new Date(),
        paidById: dto.paidById ?? null,
        receiptUrl: asNullable(dto.receiptUrl),
        projectId: dto.projectId ?? null,
        createdById: ctx.userId,
        departmentId: ctx.departmentId,
        status: ExpenseStatus.PENDING,
      },
      include: STAFF_EXPENSE_INCLUDE,
    });
  }

  /**
   * Approves a PENDING expense. Only the head of the expense's department, or
   * any user holding the `finance.write` permission (an administrator), may
   * approve. The approver is recorded on `approvedById`.
   */
  async approveStaffExpense(ctx: StaffContext, user: AuthUser, id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({
      where: { id },
      select: { id: true, departmentId: true, status: true },
    });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only PENDING expenses can be approved');
    }
    const isAdmin = user.permissions.includes('finance.write');
    const isDeptHead = ctx.isHead && expense.departmentId !== null && expense.departmentId === ctx.departmentId;
    if (!isAdmin && !isDeptHead) {
      throw new ForbiddenException(
        'Only the head of the expense’s department or an administrator can approve it',
      );
    }
    return this.prisma.expense.update({
      where: { id },
      data: { status: ExpenseStatus.APPROVED, approvedById: user.id },
      include: STAFF_EXPENSE_INCLUDE,
    });
  }

  async getExpense(id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({ where: { id }, include: EXPENSE_INCLUDE });
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  async updateExpense(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const data: Prisma.ExpenseUncheckedUpdateInput = {
      category: dto.category,
      description: dto.description,
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      incurredOn: dto.incurredOn ? new Date(dto.incurredOn) : undefined,
      receiptUrl: dto.receiptUrl !== undefined ? asNullable(dto.receiptUrl) : undefined,
      projectId: dto.projectId !== undefined ? dto.projectId : undefined,
      status: dto.status ? (dto.status as ExpenseStatus) : undefined,
    };
    await this.ensureExpense(id);
    return this.prisma.expense.update({ where: { id }, data, include: EXPENSE_INCLUDE });
  }

  async removeExpense(id: string): Promise<void> {
    const result = await this.prisma.expense.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Expense ${id} not found`);
  }

  private async ensureExpense(id: string): Promise<void> {
    const exists = await this.prisma.expense.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Expense ${id} not found`);
  }

  // ── Financial transactions ─────────────────────────────────────────────────

  async listTransactions(query: QueryTransactionsDto): Promise<Paginated<object>> {
    const where: Prisma.FinancialTransactionWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.projectId) where.projectId = query.projectId;
    if (query.search) {
      where.OR = [
        { transactionNo: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, TXN_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({ where, skip, take, orderBy }),
      this.prisma.financialTransaction.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getTransaction(id: string): Promise<FinancialTransaction> {
    const txn = await this.prisma.financialTransaction.findFirst({ where: { id } });
    if (!txn) throw new NotFoundException(`Financial transaction ${id} not found`);
    return txn;
  }

  async createTransaction(dto: CreateTransactionDto): Promise<FinancialTransaction> {
    return this.prisma.financialTransaction.create({
      data: {
        transactionNo: generateBusinessCode('TXN'),
        type: dto.type,
        direction: dto.direction,
        amount: new Prisma.Decimal(dto.amount),
        category: dto.category,
        account: asNullable(dto.account),
        reference: asNullable(dto.reference),
        occurredOn: dto.occurredOn ? new Date(dto.occurredOn) : new Date(),
        notes: asNullable(dto.notes),
        createdById: dto.createdById ?? null,
        projectId: dto.projectId ?? null,
        invoiceId: dto.invoiceId ?? null,
        status: dto.status ?? PaymentStatus.PAID,
      },
    });
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto): Promise<FinancialTransaction> {
    await this.ensureTransaction(id);
    const data: Prisma.FinancialTransactionUncheckedUpdateInput = {
      type: dto.type,
      direction: dto.direction,
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      category: dto.category,
      account: dto.account !== undefined ? asNullable(dto.account) : undefined,
      reference: dto.reference !== undefined ? asNullable(dto.reference) : undefined,
      occurredOn: dto.occurredOn ? new Date(dto.occurredOn) : undefined,
      notes: dto.notes !== undefined ? asNullable(dto.notes) : undefined,
      projectId: dto.projectId !== undefined ? dto.projectId : undefined,
      status: dto.status,
    };
    return this.prisma.financialTransaction.update({ where: { id }, data });
  }

  async removeTransaction(id: string): Promise<void> {
    const result = await this.prisma.financialTransaction.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Financial transaction ${id} not found`);
  }

  private async ensureTransaction(id: string): Promise<void> {
    const exists = await this.prisma.financialTransaction.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Financial transaction ${id} not found`);
  }

  // ── Payments (polymorphic outgoing payments) ───────────────────────────────

  async listPayments(query: QueryPaymentsDto): Promise<Paginated<object>> {
    const where: Prisma.PaymentRecordWhereInput = {};
    if (query.payeeType) where.payeeType = query.payeeType;
    if (query.payeeId) where.payeeId = query.payeeId;
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PAYMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.paymentRecord.findMany({ where, skip, take, orderBy }),
      this.prisma.paymentRecord.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getPayment(id: string): Promise<PaymentRecord> {
    const record = await this.prisma.paymentRecord.findFirst({ where: { id } });
    if (!record) throw new NotFoundException(`Payment ${id} not found`);
    return record;
  }

  async createPayment(dto: CreatePaymentDto): Promise<PaymentRecord> {
    return this.prisma.paymentRecord.create({
      data: {
        payeeType: dto.payeeType,
        payeeId: dto.payeeId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method ?? PaymentMethod.BANK_TRANSFER,
        reference: asNullable(dto.reference),
        paidOn: dto.paidOn ? new Date(dto.paidOn) : new Date(),
        status: dto.status ?? PaymentStatus.PENDING,
        notes: asNullable(dto.notes),
        receiptUrl: asNullable(dto.receiptUrl),
      },
    });
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<PaymentRecord> {
    await this.ensurePayment(id);
    const data: Prisma.PaymentRecordUncheckedUpdateInput = {
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      method: dto.method,
      reference: dto.reference !== undefined ? asNullable(dto.reference) : undefined,
      paidOn: dto.paidOn ? new Date(dto.paidOn) : undefined,
      status: dto.status,
      notes: dto.notes !== undefined ? asNullable(dto.notes) : undefined,
    };
    return this.prisma.paymentRecord.update({ where: { id }, data });
  }

  async removePayment(id: string): Promise<void> {
    const result = await this.prisma.paymentRecord.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Payment ${id} not found`);
  }

  private async ensurePayment(id: string): Promise<void> {
    const exists = await this.prisma.paymentRecord.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Payment ${id} not found`);
  }

  // ── Shared ─────────────────────────────────────────────────────────────────

  private async ensureClient(id: string): Promise<void> {
    const exists = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Client ${id} not found`);
  }

  private async ensureInvoice(id: string): Promise<{
    id: string;
    status: InvoiceStatus;
    total: Prisma.Decimal;
    tax: Prisma.Decimal | null;
    discount: Prisma.Decimal | null;
  }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, total: true, tax: true, discount: true },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }
}