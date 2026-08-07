import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@ajac/database';
import type { Quotation } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
} from '../common/dto/pagination.dto';
import type { Paginated } from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationsDto } from './dto/query-quotations.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationItemInputDto } from './dto/quotation-item.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'quotationNo', 'title', 'subtotal', 'total', 'status'] as const;

const INCLUDE = {
  lead: true,
  client: true,
  project: true,
  items: true,
} satisfies Prisma.QuotationInclude;

/** Rounds a money value to two decimal places. */
function money(value: Prisma.Decimal.Value): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function toItemAmount(item: QuotationItemInputDto): {
  description: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  amount: Prisma.Decimal;
} {
  const quantity = new Prisma.Decimal(item.quantity);
  const unitPrice = money(item.unitPrice);
  return {
    description: item.description,
    quantity,
    unitPrice,
    amount: money(quantity.mul(unitPrice)),
  };
}

function sumItems(items: Array<{ amount: Prisma.Decimal }>): Prisma.Decimal {
  return money(items.reduce((acc, item) => acc.plus(item.amount), new Prisma.Decimal(0)));
}

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryQuotationsDto): Promise<Paginated<Quotation>> {
    const where: Prisma.QuotationWhereInput = { deletedAt: null };
    if (query.status) {
      where.status = query.status;
    }
    if (query.clientId) {
      where.clientId = query.clientId;
    }
    if (query.projectId) {
      where.projectId = query.projectId;
    }
    if (query.search) {
      where.OR = [
        { quotationNo: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({ where, skip, take, orderBy, include: INCLUDE }),
      this.prisma.quotation.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Quotation> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return quotation;
  }

  async create(dto: CreateQuotationDto): Promise<Quotation> {
    const items = (dto.items ?? []).map(toItemAmount);
    const subtotal = sumItems(items);
    const tax = money(subtotal.mul(dto.taxRate ?? 0).div(100));
    const discount = money(dto.discount ?? 0);
    const total = money(subtotal.plus(tax).minus(discount));

    return this.prisma.quotation.create({
      data: {
        quotationNo: generateBusinessCode('QT'),
        title: dto.title,
        leadId: dto.leadId,
        clientId: dto.clientId,
        projectId: dto.projectId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        currency: dto.currency ?? 'GHS',
        status: dto.status,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        items: items.length
          ? {
              create: items.map((item) => ({
                description: item.description,
                quantity: item.quantity.toFixed(3),
                unitPrice: item.unitPrice.toFixed(2),
                amount: item.amount.toFixed(2),
              })),
            }
          : undefined,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateQuotationDto): Promise<Quotation> {
    const existing = await this.get(id);

    const items = dto.items ? dto.items.map(toItemAmount) : undefined;
    const subtotal = items ? sumItems(items) : money(existing.subtotal);
    // When the rate isn't supplied, keep the implied rate so a status-only
    // update never disturbs the stored figures.
    const taxRate = dto.taxRate ?? (subtotal.gt(0) ? money(existing.tax ?? 0).mul(100).div(subtotal) : 0);
    const tax = money(subtotal.mul(taxRate).div(100));
    const discount = money(dto.discount ?? existing.discount ?? 0);
    const total = money(subtotal.plus(tax).minus(discount));

    const data: Prisma.QuotationUncheckedUpdateInput = {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
    };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.leadId !== undefined) data.leadId = dto.leadId;
    if (dto.clientId !== undefined) data.clientId = dto.clientId;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.status !== undefined) data.status = dto.status;
    if (items) {
      data.items = {
        deleteMany: {},
        create: items.map((item) => ({
          description: item.description,
          quantity: item.quantity.toFixed(3),
          unitPrice: item.unitPrice.toFixed(2),
          amount: item.amount.toFixed(2),
        })),
      };
    }

    return this.prisma.quotation.update({ where: { id }, data, include: INCLUDE });
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.quotation.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
  }
}
