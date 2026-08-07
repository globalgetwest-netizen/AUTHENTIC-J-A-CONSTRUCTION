import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryTransactionType,
  Prisma,
  type Material,
  type MaterialCategory,
  type Warehouse,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
import { CreateMaterialCategoryDto } from './dto/create-material-category.dto';
import { UpdateMaterialCategoryDto } from './dto/update-material-category.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import {
  QueryInventoryDto,
  QueryInventoryTransactionsDto,
  QueryMaterialCategoriesDto,
  QueryMaterialsDto,
  QueryStockMovementsDto,
  QueryWarehousesDto,
} from './dto/query-materials.dto';
import { StockOpDto } from './dto/stock-op.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

const CATEGORY_SORTABLE = ['createdAt', 'name', 'code'] as const;
const MATERIAL_SORTABLE = ['createdAt', 'name', 'sku', 'unit', 'currentStock', 'isActive'] as const;
const WAREHOUSE_SORTABLE = ['createdAt', 'name', 'code'] as const;
const INVENTORY_SORTABLE = ['createdAt', 'updatedAt', 'quantity'] as const;
const TX_SORTABLE = ['createdAt', 'type', 'quantity'] as const;
const MOVEMENT_SORTABLE = ['movedAt', 'quantity'] as const;

const CATEGORY_COUNT = {
  _count: { select: { materials: { where: { deletedAt: null } } } },
} as const;
const MATERIAL_INCLUDE = { category: true } as const;
const MATERIAL_DETAIL_INCLUDE = {
  category: true,
  inventory: { include: { warehouse: true } },
} as const;
const WAREHOUSE_COUNT = { _count: { select: { inventory: true } } } as const;
const INVENTORY_INCLUDE = {
  material: { include: { category: true } },
  warehouse: true,
} as const;
const TX_INCLUDE = {
  material: { select: { id: true, name: true, sku: true, unit: true } },
  warehouse: { select: { id: true, name: true, code: true } },
} as const;
const MOVEMENT_INCLUDE = {
  inventory: {
    include: {
      material: { select: { id: true, name: true, sku: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
    },
  },
  fromWarehouse: { select: { id: true, name: true } },
  toWarehouse: { select: { id: true, name: true } },
} as const;

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Material categories ───────────────────────────────────────────────────

  async listCategories(query: QueryMaterialCategoriesDto): Promise<Paginated<object>> {
    const where: Prisma.MaterialCategoryWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, CATEGORY_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.materialCategory.findMany({ where, skip, take, orderBy, include: CATEGORY_COUNT }),
      this.prisma.materialCategory.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getCategory(id: string): Promise<MaterialCategory> {
    const category = await this.prisma.materialCategory.findFirst({
      where: { id },
      include: { materials: { where: { deletedAt: null } } },
    });
    if (!category) throw new NotFoundException(`Material category ${id} not found`);
    return category;
  }

  async createCategory(dto: CreateMaterialCategoryDto): Promise<MaterialCategory> {
    return this.prisma.materialCategory.create({
      data: { ...dto, code: generateBusinessCode('CAT') },
    });
  }

  async updateCategory(id: string, dto: UpdateMaterialCategoryDto): Promise<MaterialCategory> {
    await this.ensureCategory(id);
    return this.prisma.materialCategory.update({ where: { id }, data: dto });
  }

  async removeCategory(id: string): Promise<void> {
    const result = await this.prisma.materialCategory.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Material category ${id} not found`);
  }

  private async ensureCategory(id: string): Promise<void> {
    const exists = await this.prisma.materialCategory.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Material category ${id} not found`);
  }

  // ── Materials ─────────────────────────────────────────────────────────────

  async listMaterials(query: QueryMaterialsDto): Promise<Paginated<object>> {
    const where: Prisma.MaterialWhereInput = { deletedAt: null };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, MATERIAL_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.material.findMany({ where, skip, take, orderBy, include: MATERIAL_INCLUDE }),
      this.prisma.material.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getMaterial(id: string): Promise<Material> {
    const material = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: MATERIAL_DETAIL_INCLUDE,
    });
    if (!material) throw new NotFoundException(`Material ${id} not found`);
    return material;
  }

  async createMaterial(dto: CreateMaterialDto): Promise<Material> {
    return this.prisma.material.create({
      data: { ...dto, sku: generateBusinessCode('MAT') },
      include: MATERIAL_INCLUDE,
    });
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto): Promise<Material> {
    await this.ensureMaterial(id);
    return this.prisma.material.update({ where: { id }, data: dto, include: MATERIAL_INCLUDE });
  }

  async removeMaterial(id: string): Promise<void> {
    const result = await this.prisma.material.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Material ${id} not found`);
  }

  private async ensureMaterial(id: string): Promise<void> {
    const exists = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Material ${id} not found`);
  }

  // ── Warehouses ────────────────────────────────────────────────────────────

  async listWarehouses(query: QueryWarehousesDto): Promise<Paginated<object>> {
    const where: Prisma.WarehouseWhereInput = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, WAREHOUSE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({ where, skip, take, orderBy, include: WAREHOUSE_COUNT }),
      this.prisma.warehouse.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getWarehouse(id: string): Promise<Warehouse> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      include: WAREHOUSE_COUNT,
    });
    if (!warehouse) throw new NotFoundException(`Warehouse ${id} not found`);
    return warehouse;
  }

  async createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    return this.prisma.warehouse.create({
      data: { ...dto, code: generateBusinessCode('WH') },
    });
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    await this.ensureWarehouse(id);
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async removeWarehouse(id: string): Promise<void> {
    const result = await this.prisma.warehouse.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Warehouse ${id} not found`);
  }

  private async ensureWarehouse(id: string): Promise<void> {
    const exists = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Warehouse ${id} not found`);
  }

  // ── Inventory (read) ──────────────────────────────────────────────────────

  async listInventory(query: QueryInventoryDto): Promise<Paginated<object>> {
    const materialWhere: Prisma.MaterialWhereInput = { deletedAt: null };
    if (query.search) {
      materialWhere.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) materialWhere.categoryId = query.categoryId;
    const where: Prisma.InventoryWhereInput = {
      material: { is: materialWhere },
      warehouse: { is: { deletedAt: null } },
    };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, INVENTORY_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({ where, skip, take, orderBy, include: INVENTORY_INCLUDE }),
      this.prisma.inventory.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // ── Stock operations (IN / OUT / ADJUST / TRANSFER) ──────────────────────

  async receiveStock(dto: StockOpDto, userId: string): Promise<{ id: string; quantity: Prisma.Decimal }> {
    if (dto.quantity <= 0) throw new BadRequestException('Quantity must be greater than zero');
    return this.prisma.$transaction(async (tx) => {
      const inventory = await this.adjustInventory(
        tx,
        dto.materialId,
        dto.warehouseId,
        this.dec(dto.quantity),
      );
      await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          warehouseId: dto.warehouseId,
          type: InventoryTransactionType.IN,
          quantity: dto.quantity,
          unitCost: dto.unitCost ?? null,
          referenceType: dto.referenceType ?? null,
          referenceId: dto.referenceId ?? null,
          notes: dto.notes ?? null,
          createdById: userId,
        },
      });
      return inventory;
    });
  }

  async issueStock(dto: StockOpDto, userId: string): Promise<{ id: string; quantity: Prisma.Decimal }> {
    if (dto.quantity <= 0) throw new BadRequestException('Quantity must be greater than zero');
    return this.prisma.$transaction(async (tx) => {
      const current = await this.inventoryQuantity(tx, dto.materialId, dto.warehouseId);
      if (current.lessThan(this.dec(dto.quantity))) {
        throw new BadRequestException('Insufficient stock');
      }
      const inventory = await this.adjustInventory(
        tx,
        dto.materialId,
        dto.warehouseId,
        this.dec(-dto.quantity),
      );
      await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          warehouseId: dto.warehouseId,
          type: InventoryTransactionType.OUT,
          quantity: dto.quantity,
          unitCost: dto.unitCost ?? null,
          referenceType: dto.referenceType ?? null,
          referenceId: dto.referenceId ?? null,
          notes: dto.notes ?? null,
          createdById: userId,
        },
      });
      return inventory;
    });
  }

  /** ADJUST sets stock to the counted `quantity` (0 allowed). */
  async adjustStock(dto: StockOpDto, userId: string): Promise<{ id: string; quantity: Prisma.Decimal }> {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await this.setInventoryQuantity(
        tx,
        dto.materialId,
        dto.warehouseId,
        this.dec(dto.quantity),
      );
      await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          warehouseId: dto.warehouseId,
          type: InventoryTransactionType.ADJUST,
          quantity: dto.quantity,
          unitCost: dto.unitCost ?? null,
          referenceType: dto.referenceType ?? null,
          referenceId: dto.referenceId ?? null,
          notes: dto.notes ?? null,
          createdById: userId,
        },
      });
      return inventory;
    });
  }

  async transferStock(dto: TransferStockDto, userId: string): Promise<{ id: string; quantity: Prisma.Decimal }> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must differ');
    }
    return this.prisma.$transaction(async (tx) => {
      const fromQty = await this.inventoryQuantity(tx, dto.materialId, dto.fromWarehouseId);
      if (fromQty.lessThan(this.dec(dto.quantity))) {
        throw new BadRequestException('Insufficient stock');
      }
      await this.adjustInventory(tx, dto.materialId, dto.fromWarehouseId, this.dec(-dto.quantity));
      const toInventory = await this.adjustInventory(
        tx,
        dto.materialId,
        dto.toWarehouseId,
        this.dec(dto.quantity),
      );
      const txRow = await tx.inventoryTransaction.create({
        data: {
          materialId: dto.materialId,
          warehouseId: dto.toWarehouseId,
          type: InventoryTransactionType.TRANSFER,
          quantity: dto.quantity,
          notes: dto.notes ?? null,
          createdById: userId,
        },
      });
      await tx.stockMovement.create({
        data: {
          inventoryId: toInventory.id,
          transactionId: txRow.id,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          quantity: dto.quantity,
          notes: dto.notes ?? null,
        },
      });
      return toInventory;
    });
  }

  // ── Inventory transactions (ledger) ───────────────────────────────────────

  async listTransactions(query: QueryInventoryTransactionsDto): Promise<Paginated<object>> {
    const where: Prisma.InventoryTransactionWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.materialId) where.materialId = query.materialId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, TX_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({ where, skip, take, orderBy, include: TX_INCLUDE }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // ── Stock movements (transfer audit) ──────────────────────────────────────

  async listStockMovements(query: QueryStockMovementsDto): Promise<Paginated<object>> {
    const where: Prisma.StockMovementWhereInput = {};
    if (query.materialId) where.inventory = { is: { materialId: query.materialId } };
    if (query.warehouseId) {
      where.OR = [{ fromWarehouseId: query.warehouseId }, { toWarehouseId: query.warehouseId }];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, MOVEMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({ where, skip, take, orderBy, include: MOVEMENT_INCLUDE }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private dec(value: number | string | Prisma.Decimal): Prisma.Decimal {
    return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  }

  private async inventoryQuantity(
    tx: Prisma.TransactionClient,
    materialId: string,
    warehouseId: string,
  ): Promise<Prisma.Decimal> {
    const row = await tx.inventory.findUnique({
      where: { materialId_warehouseId: { materialId, warehouseId } },
      select: { quantity: true },
    });
    return row ? row.quantity : new Prisma.Decimal(0);
  }

  /** Adds `delta` to the material's stock in `warehouseId`, creating the row if absent. */
  private async adjustInventory(
    tx: Prisma.TransactionClient,
    materialId: string,
    warehouseId: string,
    delta: Prisma.Decimal,
  ): Promise<{ id: string; quantity: Prisma.Decimal }> {
    const existing = await tx.inventory.findUnique({
      where: { materialId_warehouseId: { materialId, warehouseId } },
      select: { id: true, quantity: true },
    });
    if (existing) {
      return tx.inventory.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity.plus(delta) },
        select: { id: true, quantity: true },
      });
    }
    return tx.inventory.create({
      data: { materialId, warehouseId, quantity: delta },
      select: { id: true, quantity: true },
    });
  }

  /** Sets stock to an absolute value (used by ADJUST). */
  private async setInventoryQuantity(
    tx: Prisma.TransactionClient,
    materialId: string,
    warehouseId: string,
    quantity: Prisma.Decimal,
  ): Promise<{ id: string; quantity: Prisma.Decimal }> {
    const existing = await tx.inventory.findUnique({
      where: { materialId_warehouseId: { materialId, warehouseId } },
      select: { id: true },
    });
    if (existing) {
      return tx.inventory.update({
        where: { id: existing.id },
        data: { quantity },
        select: { id: true, quantity: true },
      });
    }
    return tx.inventory.create({
      data: { materialId, warehouseId, quantity },
      select: { id: true, quantity: true },
    });
  }
}
