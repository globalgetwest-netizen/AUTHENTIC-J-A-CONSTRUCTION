import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  TransactionDirection,
  TransactionType,
} from '@ajac/database';
import type { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';

type MockCrud = Record<
  'findFirst' | 'findUnique' | 'findMany' | 'count' | 'create' | 'update' | 'updateMany' | 'deleteMany' | 'aggregate',
  ReturnType<typeof vi.fn>
>;

function makeService(): {
  service: FinanceService;
  invoice: MockCrud;
  item: MockCrud;
  receipt: MockCrud;
  expense: MockCrud;
  txn: MockCrud;
  payment: MockCrud;
  client: MockCrud;
} {
  const make = (): MockCrud => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
  });
  const invoice = make();
  const item = make();
  const receipt = make();
  const expense = make();
  const txn = make();
  const payment = make();
  const client = make();
  const prisma = {
    invoice,
    invoiceItem: item,
    receipt,
    expense,
    financialTransaction: txn,
    paymentRecord: payment,
    client,
  } as unknown as PrismaService;
  return { service: new FinanceService(prisma), invoice, item, receipt, expense, txn, payment, client };
}

describe('FinanceService', () => {
  it('creates an invoice with an auto INV no and computes totals', async () => {
    const { service, invoice, client } = makeService();
    client.findFirst.mockResolvedValue({ id: 'c1' });
    invoice.create.mockImplementation(({ data }) => Promise.resolve({ id: 'i1', ...data }));

    const created = await service.createInvoice({
      clientId: 'c1',
      dueOn: '2026-09-01',
      tax: 50,
      discount: 10,
      items: [
        { description: 'Foundation work', quantity: 2, unitPrice: 500 },
        { description: 'Labour', quantity: 1, unitPrice: 200 },
      ],
    });

    expect(created.invoiceNo).toMatch(/^INV-/);
    expect(created.subtotal.toNumber()).toBe(1200);
    expect(created.total.toNumber()).toBe(1240);
  });

  it('throws NotFound when creating an invoice for a missing client', async () => {
    const { service, client } = makeService();
    client.findFirst.mockResolvedValue(null);
    await expect(
      service.createInvoice({ clientId: 'c1', dueOn: '2026-09-01', items: [{ description: 'x', quantity: 1, unitPrice: 10 }] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('reconciles an invoice to PAID once receipts cover its total', async () => {
    const { service, client, invoice, receipt } = makeService();
    client.findFirst.mockResolvedValue({ id: 'c1' });
    invoice.findFirst.mockResolvedValue({
      id: 'i1',
      total: new Prisma.Decimal(1000),
      status: InvoiceStatus.SENT,
    });
    receipt.create.mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data }));
    receipt.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(1000) } });
    invoice.update.mockResolvedValue({ id: 'i1', status: InvoiceStatus.PAID });

    const receiptCreated = await service.createReceipt({
      clientId: 'c1',
      invoiceId: 'i1',
      amount: 1000,
    });

    expect(receiptCreated.receiptNo).toMatch(/^RCP-/);
    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: InvoiceStatus.PAID, paidOn: expect.any(Date) }),
      }),
    );
  });

  it('marks an invoice PART_PAID when receipts only partly cover it', async () => {
    const { service, client, invoice, receipt } = makeService();
    client.findFirst.mockResolvedValue({ id: 'c1' });
    invoice.findFirst.mockResolvedValue({
      id: 'i1',
      total: new Prisma.Decimal(1000),
      status: InvoiceStatus.SENT,
    });
    receipt.create.mockResolvedValue({ id: 'r1' });
    receipt.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(250) } });
    invoice.update.mockResolvedValue({ id: 'i1', status: InvoiceStatus.PART_PAID });

    await service.createReceipt({ clientId: 'c1', invoiceId: 'i1', amount: 250 });

    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: InvoiceStatus.PART_PAID }),
      }),
    );
  });

  it('does not reconcile a VOID invoice', async () => {
    const { service, client, invoice, receipt } = makeService();
    client.findFirst.mockResolvedValue({ id: 'c1' });
    invoice.findFirst.mockResolvedValue({
      id: 'i1',
      total: new Prisma.Decimal(1000),
      status: InvoiceStatus.VOID,
    });
    receipt.create.mockResolvedValue({ id: 'r1' });

    await service.createReceipt({ clientId: 'c1', invoiceId: 'i1', amount: 1000 });

    expect(invoice.update).not.toHaveBeenCalled();
  });

  it('appends an invoice item and refreshes totals', async () => {
    const { service, invoice, item, receipt } = makeService();
    invoice.findFirst.mockResolvedValue({
      id: 'i1',
      status: InvoiceStatus.DRAFT,
      total: new Prisma.Decimal(100),
      tax: new Prisma.Decimal(0),
      discount: new Prisma.Decimal(0),
    });
    item.create.mockResolvedValue({ id: 'it1' });
    item.findMany.mockResolvedValue([
      { quantity: new Prisma.Decimal(2), unitPrice: new Prisma.Decimal(50) },
      { quantity: new Prisma.Decimal(1), unitPrice: new Prisma.Decimal(10) },
    ]);
    receipt.aggregate.mockResolvedValue({ _sum: { amount: null } });
    invoice.update.mockResolvedValue({ id: 'i1', subtotal: new Prisma.Decimal(110), total: new Prisma.Decimal(110) });

    await service.addInvoiceItem('i1', { description: 'Extra', quantity: 1, unitPrice: 10 });

    expect(invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subtotal: expect.any(Prisma.Decimal), total: expect.any(Prisma.Decimal) }),
      }),
    );
  });

  it('creates an expense with an auto EXP no and PENDING status', async () => {
    const { service, expense } = makeService();
    expense.create.mockImplementation(({ data }) => Promise.resolve({ id: 'e1', ...data }));

    const created = await service.createExpense({ category: 'FUEL', description: 'Diesel', amount: 450 });

    expect(created.expenseNo).toMatch(/^EXP-/);
    expect(created.status).toBe('PENDING');
  });

  it('creates a financial transaction with an auto TXN no', async () => {
    const { service, txn } = makeService();
    txn.create.mockImplementation(({ data }) => Promise.resolve({ id: 't1', ...data }));

    const created = await service.createTransaction({
      type: TransactionType.EXPENSE,
      direction: TransactionDirection.DEBIT,
      amount: 900,
      category: 'LABOUR',
    });

    expect(created.transactionNo).toMatch(/^TXN-/);
    expect(created.status).toBe(PaymentStatus.PAID);
  });

  it('lists expenses filtered by status', async () => {
    const { service, expense } = makeService();
    expense.findMany.mockResolvedValue([{ id: 'e1' }]);
    expense.count.mockResolvedValue(1);

    const result = await service.listExpenses({ page: 1, pageSize: 20, status: 'APPROVED' });

    expect(result.data).toEqual([{ id: 'e1' }]);
    expect(expense.findMany.mock.calls[0]?.[0]?.where.status).toBe('APPROVED');
  });
});