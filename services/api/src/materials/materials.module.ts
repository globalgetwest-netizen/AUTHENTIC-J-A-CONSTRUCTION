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

@Module({
  controllers: [
    MaterialCategoriesController,
    MaterialsController,
    WarehousesController,
    InventoryController,
    InventoryTransactionsController,
    StockMovementsController,
  ],
  providers: [MaterialsService],
})
export class MaterialsModule {}
