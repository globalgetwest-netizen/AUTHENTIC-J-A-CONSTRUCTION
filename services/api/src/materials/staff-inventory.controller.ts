import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { requireDepartmentCode, resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import {
  QueryInventoryDto,
  QueryInventoryTransactionsDto,
  QueryMaterialCategoriesDto,
  QueryMaterialsDto,
  QueryStockMovementsDto,
  QueryWarehousesDto,
} from './dto/query-materials.dto';
import { StaffStockOpDto } from './dto/staff-stock-op.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

/**
 * Staff portal — Stores & Inventory. Authenticated-only. The shared stock views
 * (inventory levels, materials, movements) are read by any storekeeper; the
 * writes (receive / issue / adjust / transfer) are Stores-department operations
 * that are recorded against the acting user.
 */
@Controller('staff/inventory')
export class StaffInventoryController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryInventoryDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.materials.listInventory(query);
  }
}

@Controller('staff/inventory-transactions')
export class StaffInventoryTransactionsController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryInventoryTransactionsDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.materials.listTransactionsForStaff(ctx, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: StaffStockOpDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-STORES');
    if (dto.type === 'IN') return this.materials.receiveStock(dto, ctx.userId);
    if (dto.type === 'OUT') return this.materials.issueStock(dto, ctx.userId);
    return this.materials.adjustStock(dto, ctx.userId);
  }
}

@Controller('staff/stock-movements')
export class StaffStockMovementsController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryStockMovementsDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.materials.listStockMovements(query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: TransferStockDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-STORES');
    return this.materials.transferStock(dto, ctx.userId);
  }
}

@Controller('staff/materials')
export class StaffMaterialsController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryMaterialsDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.materials.listMaterials(query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateMaterialDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-PROCUREMENT');
    return this.materials.createMaterial(dto);
  }
}

/** Shared warehouse catalogue — read by any staff member for stock forms. */
@Controller('staff/warehouses')
export class StaffWarehousesController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryWarehousesDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.materials.listWarehouses(query);
  }
}

/** Shared material-category catalogue — read by any staff member for material forms. */
@Controller('staff/material-categories')
export class StaffMaterialCategoriesController {
  constructor(
    private readonly materials: MaterialsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryMaterialCategoriesDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.materials.listCategories(query);
  }
}
