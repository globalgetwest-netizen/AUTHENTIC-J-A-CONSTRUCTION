import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  type BlockProduct,
  type BlockProduction,
  type BlockSale,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateBlockProductDto } from './dto/create-block-product.dto';
import { UpdateBlockProductDto } from './dto/update-block-product.dto';
import { CreateBlockProductionDto } from './dto/create-block-production.dto';
import { UpdateBlockProductionDto } from './dto/update-block-production.dto';
import { CreateBlockSaleDto } from './dto/create-block-sale.dto';
import { UpdateBlockSaleDto } from './dto/update-block-sale.dto';
import {
  QueryBlockProductsDto,
  QueryBlockProductionsDto,
  QueryBlockSalesDto,
} from './dto/query-blocks.dto';
import type { StaffContext } from '../common/staff/staff-context';

const PRODUCT_SORTABLE = ['createdAt', 'name', 'code', 'unitPrice', 'isActive'] as const;
const PRODUCTION_SORTABLE = ['createdAt', 'quantity', 'producedOn', 'status'] as const;
const SALE_SORTABLE = ['createdAt', 'quantity', 'unitPrice', 'totalAmount', 'status', 'soldOn'] as const;

const PRODUCT_COUNT = {
  _count: { select: { productions: true, sales: true } },
} as const;
const PRODUCTION_INCLUDE = { product: true } as const;
const SALE_INCLUDE = {
  product: true,
  client: { select: { id: true, companyName: true, contactName: true } },
} as const;

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Block products ────────────────────────────────────────────────────────

  async listProducts(query: QueryBlockProductsDto): Promise<Paginated<object>> {
    const where: Prisma.BlockProductWhereInput = { deletedAt: null };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PRODUCT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.blockProduct.findMany({ where, skip, take, orderBy, include: PRODUCT_COUNT }),
      this.prisma.blockProduct.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getProduct(id: string): Promise<BlockProduct> {
    const product = await this.prisma.blockProduct.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_COUNT,
    });
    if (!product) throw new NotFoundException(`Block product ${id} not found`);
    return product;
  }

  async createProduct(dto: CreateBlockProductDto): Promise<BlockProduct> {
    return this.prisma.blockProduct.create({
      data: { ...dto, code: generateBusinessCode('BLC') },
    });
  }

  async updateProduct(id: string, dto: UpdateBlockProductDto): Promise<BlockProduct> {
    await this.ensureProduct(id);
    return this.prisma.blockProduct.update({ where: { id }, data: dto });
  }

  async removeProduct(id: string): Promise<void> {
    const result = await this.prisma.blockProduct.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Block product ${id} not found`);
  }

  private async ensureProduct(id: string): Promise<void> {
    const exists = await this.prisma.blockProduct.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Block product ${id} not found`);
  }

  // ── Block productions ─────────────────────────────────────────────────────

  async listProductions(query: QueryBlockProductionsDto): Promise<Paginated<object>> {
    const where: Prisma.BlockProductionWhereInput = {};
    if (query.productId) where.productId = query.productId;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PRODUCTION_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.blockProduction.findMany({ where, skip, take, orderBy, include: PRODUCTION_INCLUDE }),
      this.prisma.blockProduction.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getProduction(id: string): Promise<BlockProduction> {
    const production = await this.prisma.blockProduction.findFirst({
      where: { id },
      include: PRODUCTION_INCLUDE,
    });
    if (!production) throw new NotFoundException(`Block production ${id} not found`);
    return production;
  }

  async createProduction(dto: CreateBlockProductionDto): Promise<BlockProduction> {
    const product = await this.prisma.blockProduct.findFirst({
      where: { id: dto.productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(`Block product ${dto.productId} not found`);
    return this.prisma.blockProduction.create({
      data: {
        productId: dto.productId,
        batchNo: generateBusinessCode('PRD'),
        quantity: dto.quantity,
        producedOn: dto.producedOn ? new Date(dto.producedOn) : new Date(),
        notes: dto.notes ?? null,
        status: dto.status ?? 'COMPLETED',
        supervisorId: dto.supervisorId ?? null,
      },
      include: PRODUCTION_INCLUDE,
    });
  }

  // ── Staff portal: block production batches ─────────────────────────────────

  /**
   * Production batches scoped to the caller: regular operators see the batches
   * they supervised; the Block Production head sees every batch from the
   * department's floor.
   */
  async listProductionsForStaff(ctx: StaffContext, query: QueryBlockProductionsDto): Promise<Paginated<object>> {
    const where: Prisma.BlockProductionWhereInput = {};
    if (!ctx.isHead) where.supervisorId = ctx.employeeId;
    if (query.productId) where.productId = query.productId;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PRODUCTION_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.blockProduction.findMany({ where, skip, take, orderBy, include: PRODUCTION_INCLUDE }),
      this.prisma.blockProduction.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  /**
   * A block-factory operator records a production batch they supervised. The
   * caller's employee is recorded as `supervisorId` so batches stay attributed.
   */
  async createStaffProduction(ctx: StaffContext, dto: CreateBlockProductionDto): Promise<BlockProduction> {
    const product = await this.prisma.blockProduct.findFirst({
      where: { id: dto.productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) throw new NotFoundException(`Block product ${dto.productId} not found`);
    return this.prisma.blockProduction.create({
      data: {
        productId: dto.productId,
        batchNo: generateBusinessCode('PRD'),
        quantity: dto.quantity,
        producedOn: dto.producedOn ? new Date(dto.producedOn) : new Date(),
        notes: dto.notes ?? null,
        status: dto.status ?? 'COMPLETED',
        supervisorId: ctx.employeeId,
      },
      include: PRODUCTION_INCLUDE,
    });
  }

  async updateProduction(id: string, dto: UpdateBlockProductionDto): Promise<BlockProduction> {
    await this.ensureProduction(id);
    const data: Prisma.BlockProductionUncheckedUpdateInput = {
      productId: dto.productId,
      quantity: dto.quantity,
      producedOn: dto.producedOn ? new Date(dto.producedOn) : undefined,
      notes: dto.notes,
      status: dto.status,
      supervisorId: dto.supervisorId,
    };
    return this.prisma.blockProduction.update({ where: { id }, data, include: PRODUCTION_INCLUDE });
  }

  async removeProduction(id: string): Promise<void> {
    const result = await this.prisma.blockProduction.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Block production ${id} not found`);
  }

  private async ensureProduction(id: string): Promise<void> {
    const exists = await this.prisma.blockProduction.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Block production ${id} not found`);
  }

  // ── Block sales ───────────────────────────────────────────────────────────

  async listSales(query: QueryBlockSalesDto): Promise<Paginated<object>> {
    const where: Prisma.BlockSaleWhereInput = {};
    if (query.productId) where.productId = query.productId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { product: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SALE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.blockSale.findMany({ where, skip, take, orderBy, include: SALE_INCLUDE }),
      this.prisma.blockSale.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getSale(id: string): Promise<BlockSale> {
    const sale = await this.prisma.blockSale.findFirst({ where: { id }, include: SALE_INCLUDE });
    if (!sale) throw new NotFoundException(`Block sale ${id} not found`);
    return sale;
  }

  /** `totalAmount` is computed server-side as quantity × unitPrice (product price when omitted). */
  async createSale(dto: CreateBlockSaleDto): Promise<BlockSale> {
    const product = await this.prisma.blockProduct.findFirst({
      where: { id: dto.productId, deletedAt: null },
      select: { unitPrice: true },
    });
    if (!product) throw new NotFoundException(`Block product ${dto.productId} not found`);
    const unitPrice = dto.unitPrice ?? Number(product.unitPrice);
    const totalAmount = new Prisma.Decimal(unitPrice).times(dto.quantity);
    return this.prisma.blockSale.create({
      data: {
        productId: dto.productId,
        clientId: dto.clientId ?? null,
        quantity: dto.quantity,
        unitPrice,
        totalAmount,
        soldOn: new Date(dto.soldOn),
        reference: dto.reference ?? null,
        status: PaymentStatus.PENDING,
      },
      include: SALE_INCLUDE,
    });
  }

  async updateSale(id: string, dto: UpdateBlockSaleDto): Promise<BlockSale> {
    const current = await this.ensureSale(id);
    const data: Prisma.BlockSaleUncheckedUpdateInput = {
      productId: dto.productId,
      clientId: dto.clientId !== undefined ? dto.clientId : undefined,
      quantity: dto.quantity,
      soldOn: dto.soldOn ? new Date(dto.soldOn) : undefined,
      reference: dto.reference !== undefined ? dto.reference : undefined,
      status: dto.status,
    };
    const priceChanged = dto.unitPrice !== undefined;
    const qtyChanged = dto.quantity !== undefined;
    if (qtyChanged || priceChanged) {
      const qty = dto.quantity ?? current.quantity;
      const product = await this.prisma.blockProduct.findFirst({
        where: { id: dto.productId ?? current.productId, deletedAt: null },
        select: { unitPrice: true },
      });
      // unitPrice is non-nullable in the schema: an explicit null means
      // "revert to the product price" (recomputed below), never stored as null.
      const price =
        dto.unitPrice !== undefined && dto.unitPrice !== null
          ? dto.unitPrice
          : dto.unitPrice === null
            ? Number(product?.unitPrice ?? 0)
            : current.unitPrice;
      if (priceChanged) data.unitPrice = new Prisma.Decimal(price);
      data.totalAmount = new Prisma.Decimal(qty).times(new Prisma.Decimal(price));
    }
    return this.prisma.blockSale.update({ where: { id }, data, include: SALE_INCLUDE });
  }

  async removeSale(id: string): Promise<void> {
    const result = await this.prisma.blockSale.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Block sale ${id} not found`);
  }

  private async ensureSale(id: string): Promise<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
  }> {
    const sale = await this.prisma.blockSale.findFirst({
      where: { id },
      select: { id: true, productId: true, quantity: true, unitPrice: true },
    });
    if (!sale) throw new NotFoundException(`Block sale ${id} not found`);
    return sale;
  }
}
