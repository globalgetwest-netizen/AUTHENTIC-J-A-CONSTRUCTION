import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Property, type PropertySale, type PropertyType } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto';
import { UpdatePropertyTypeDto } from './dto/update-property-type.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreatePropertySaleDto } from './dto/create-property-sale.dto';
import { UpdatePropertySaleDto } from './dto/update-property-sale.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { QueryPropertySalesDto } from './dto/query-property-sales.dto';

const TYPE_SORTABLE = ['createdAt', 'name', 'code'] as const;
const PROPERTY_SORTABLE = ['createdAt', 'name', 'code', 'price', 'status'] as const;
const SALE_SORTABLE = ['createdAt', 'saleCode', 'price', 'saleDate', 'status'] as const;

const TYPE_COUNT = { _count: { select: { properties: true } } } as const;
const PROPERTY_INCLUDE = { propertyType: true, project: true } as const;
const SALE_INCLUDE = { property: true, client: true } as const;

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Property types ───────────────────────────────────────────────────────

  async listTypes(query: QueryPropertiesDto): Promise<Paginated<object>> {
    const where: Prisma.PropertyTypeWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, TYPE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.propertyType.findMany({ where, skip, take, orderBy, include: TYPE_COUNT }),
      this.prisma.propertyType.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getType(id: string): Promise<PropertyType> {
    const type = await this.prisma.propertyType.findFirst({ where: { id } });
    if (!type) throw new NotFoundException(`Property type ${id} not found`);
    return type;
  }

  async createType(dto: CreatePropertyTypeDto): Promise<PropertyType> {
    return this.prisma.propertyType.create({
      data: { ...dto, code: dto.code ?? generateBusinessCode('PTY') },
    });
  }

  async updateType(id: string, dto: UpdatePropertyTypeDto): Promise<PropertyType> {
    await this.ensureType(id);
    return this.prisma.propertyType.update({ where: { id }, data: dto });
  }

  async removeType(id: string): Promise<void> {
    const result = await this.prisma.propertyType.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Property type ${id} not found`);
  }

  private async ensureType(id: string): Promise<void> {
    const exists = await this.prisma.propertyType.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Property type ${id} not found`);
  }

  // ── Properties ───────────────────────────────────────────────────────────

  async list(query: QueryPropertiesDto): Promise<Paginated<object>> {
    const where: Prisma.PropertyWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.typeId) where.typeId = query.typeId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, PROPERTY_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({ where, skip, take, orderBy, include: PROPERTY_INCLUDE }),
      this.prisma.property.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async get(id: string): Promise<Property> {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: PROPERTY_INCLUDE,
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }

  async create(dto: CreatePropertyDto): Promise<Property> {
    return this.prisma.property.create({
      data: {
        name: dto.name,
        code: dto.code ?? generateBusinessCode('PROP'),
        typeId: dto.typeId,
        projectId: dto.projectId,
        status: dto.status ?? 'AVAILABLE',
        description: dto.description,
        address: dto.address,
        location: dto.location,
        price: dto.price ?? null,
        areaSqm: dto.areaSqm ?? null,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        floorPlanUrl: dto.floorPlanUrl,
        featured: dto.featured ?? false,
      },
      include: PROPERTY_INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePropertyDto): Promise<Property> {
    await this.ensure(id);
    return this.prisma.property.update({ where: { id }, data: dto, include: PROPERTY_INCLUDE });
  }

  async remove(id: string): Promise<void> {
    await this.softDelete(id, 'Property');
  }

  private async ensure(id: string): Promise<void> {
    const exists = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Property ${id} not found`);
  }

  private async softDelete(id: string, label: string): Promise<void> {
    const result = await this.prisma.property.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`${label} ${id} not found`);
  }

  // ── Property sales (ownership) ───────────────────────────────────────────

  async listSales(query: QueryPropertySalesDto): Promise<Paginated<object>> {
    const where: Prisma.PropertySaleWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.search) {
      where.OR = [
        { saleCode: { contains: query.search, mode: 'insensitive' } },
        { client: { is: { companyName: { contains: query.search, mode: 'insensitive' } } } },
        { client: { is: { contactName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, SALE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.propertySale.findMany({ where, skip, take, orderBy, include: SALE_INCLUDE }),
      this.prisma.propertySale.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getSale(id: string): Promise<PropertySale> {
    const sale = await this.prisma.propertySale.findFirst({
      where: { id },
      include: SALE_INCLUDE,
    });
    if (!sale) throw new NotFoundException(`Property sale ${id} not found`);
    return sale;
  }

  async createSale(dto: CreatePropertySaleDto): Promise<PropertySale> {
    const status = dto.status ?? 'PENDING';
    const deposit = dto.depositAmount ?? 0;
    const sale = await this.prisma.propertySale.create({
      data: {
        propertyId: dto.propertyId,
        clientId: dto.clientId,
        saleCode: generateBusinessCode('SALE'),
        price: dto.price,
        depositAmount: dto.depositAmount,
        balanceAmount: dto.balanceAmount ?? dto.price - deposit,
        status,
        saleDate: new Date(dto.saleDate),
        closedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
    await this.syncPropertyStatus(dto.propertyId, status);
    return this.getSale(sale.id);
  }

  async updateSale(id: string, dto: UpdatePropertySaleDto): Promise<PropertySale> {
    await this.ensureSale(id);

    let balance = dto.balanceAmount;
    if ((dto.price !== undefined || dto.depositAmount !== undefined) && dto.balanceAmount === undefined) {
      const current = await this.prisma.propertySale.findFirst({
        where: { id },
        select: { price: true, depositAmount: true },
      });
      const price = dto.price ?? Number(current?.price ?? 0);
      const deposit = dto.depositAmount ?? Number(current?.depositAmount ?? 0);
      balance = price - deposit;
    }

    const status = dto.status;
    const data: Prisma.PropertySaleUncheckedUpdateInput = {
      propertyId: dto.propertyId,
      clientId: dto.clientId,
      price: dto.price,
      depositAmount: dto.depositAmount,
      balanceAmount: balance,
      saleDate: dto.saleDate ? new Date(dto.saleDate) : undefined,
      closedAt: status === 'COMPLETED' ? new Date() : dto.closedAt === null ? null : undefined,
      status,
    };
    const sale = await this.prisma.propertySale.update({ where: { id }, data });
    if (dto.propertyId && status) await this.syncPropertyStatus(dto.propertyId, status);
    return this.getSale(sale.id);
  }

  async removeSale(id: string): Promise<void> {
    const result = await this.prisma.propertySale.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Property sale ${id} not found`);
  }

  private async ensureSale(id: string): Promise<void> {
    const exists = await this.prisma.propertySale.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Property sale ${id} not found`);
  }

  /** A completed sale marks its property SOLD. */
  private async syncPropertyStatus(propertyId: string, status: string): Promise<void> {
    if (status === 'COMPLETED') {
      await this.prisma.property.updateMany({
        where: { id: propertyId, deletedAt: null },
        data: { status: 'SOLD' },
      });
    }
  }
}
