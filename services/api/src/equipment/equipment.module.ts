import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import {
  AssetAssignmentsController,
  AssetsController,
  EquipmentController,
  MaintenanceController,
  VehiclesController,
} from './equipment.controller';
import { StaffEquipmentController, StaffMaintenanceController } from './staff-maintenance.controller';

@Module({
  controllers: [
    EquipmentController,
    VehiclesController,
    MaintenanceController,
    AssetsController,
    AssetAssignmentsController,
    StaffMaintenanceController,
    StaffEquipmentController,
  ],
  providers: [EquipmentService],
})
export class EquipmentModule {}