import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import {
  AssetAssignmentsController,
  AssetsController,
  EquipmentController,
  MaintenanceController,
  VehiclesController,
} from './equipment.controller';

@Module({
  controllers: [
    EquipmentController,
    VehiclesController,
    MaintenanceController,
    AssetsController,
    AssetAssignmentsController,
  ],
  providers: [EquipmentService],
})
export class EquipmentModule {}