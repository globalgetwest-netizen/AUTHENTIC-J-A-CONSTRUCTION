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
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { MaterialsService } from './materials.service';
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

@Controller('material-categories')
export class MaterialCategoriesController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryMaterialCategoriesDto) {
    return this.materials.listCategories(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.materials.getCategory(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateMaterialCategoryDto) {
    return this.materials.createCategory(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialCategoryDto) {
    return this.materials.updateCategory(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.materials.removeCategory(id);
  }
}

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryMaterialsDto) {
    return this.materials.listMaterials(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.materials.getMaterial(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateMaterialDto) {
    return this.materials.createMaterial(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto) {
    return this.materials.updateMaterial(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.materials.removeMaterial(id);
  }
}

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryWarehousesDto) {
    return this.materials.listWarehouses(query);
  }

  @Get(':id')
  @RequirePermissions('materials.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.materials.getWarehouse(id);
  }

  @Post()
  @RequirePermissions('materials.write')
  create(@Body() dto: CreateWarehouseDto) {
    return this.materials.createWarehouse(dto);
  }

  @Patch(':id')
  @RequirePermissions('materials.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto) {
    return this.materials.updateWarehouse(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('materials.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.materials.removeWarehouse(id);
  }
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryInventoryDto) {
    return this.materials.listInventory(query);
  }

  @Post('receipts')
  @RequirePermissions('materials.write')
  receive(@CurrentUser() user: AuthUser, @Body() dto: StockOpDto) {
    return this.materials.receiveStock(dto, user.id);
  }

  @Post('issuances')
  @RequirePermissions('materials.write')
  issue(@CurrentUser() user: AuthUser, @Body() dto: StockOpDto) {
    return this.materials.issueStock(dto, user.id);
  }

  @Post('adjustments')
  @RequirePermissions('materials.write')
  adjust(@CurrentUser() user: AuthUser, @Body() dto: StockOpDto) {
    return this.materials.adjustStock(dto, user.id);
  }

  @Post('transfers')
  @RequirePermissions('materials.write')
  transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferStockDto) {
    return this.materials.transferStock(dto, user.id);
  }
}

@Controller('inventory-transactions')
export class InventoryTransactionsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryInventoryTransactionsDto) {
    return this.materials.listTransactions(query);
  }
}

@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly materials: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.read')
  list(@Query() query: QueryStockMovementsDto) {
    return this.materials.listStockMovements(query);
  }
}
