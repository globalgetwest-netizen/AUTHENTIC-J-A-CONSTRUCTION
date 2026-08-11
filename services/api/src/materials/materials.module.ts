import { Module } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import {
  InventoryController,
  InventoryTransactionsController,
  MaterialCategoriesController,
  MaterialsController,
  StockMovementsController,
  WarehousesController,
} from './materials.controller';
import {
  StaffInventoryController,
  StaffInventoryTransactionsController,
  StaffMaterialCategoriesController,
  StaffMaterialsController,
  StaffStockMovementsController,
  StaffWarehousesController,
} from './staff-inventory.controller';

@Module({
  controllers: [
    MaterialCategoriesController,
    MaterialsController,
    WarehousesController,
    InventoryController,
    InventoryTransactionsController,
    StockMovementsController,
    StaffInventoryController,
    StaffInventoryTransactionsController,
    StaffStockMovementsController,
    StaffMaterialsController,
    StaffWarehousesController,
    StaffMaterialCategoriesController,
  ],
  providers: [MaterialsService],
})
export class MaterialsModule {}
