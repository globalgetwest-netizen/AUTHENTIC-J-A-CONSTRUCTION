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
import { EquipmentService } from './equipment.service';
import { QueryEquipmentsDto } from './dto/equipment-query.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { QueryVehiclesDto } from './dto/vehicle-query.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryMaintenanceDto } from './dto/maintenance-query.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryAssetsDto } from './dto/asset-query.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetAssignmentsDto } from './dto/asset-assignment-query.dto';
import { CreateAssetAssignmentDto } from './dto/create-asset-assignment.dto';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment.read')
  list(@Query() query: QueryEquipmentsDto) {
    return this.service.listEquipments(query);
  }

  @Get(':id')
  @RequirePermissions('equipment.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getEquipment(id);
  }

  @Post()
  @RequirePermissions('equipment.write')
  create(@Body() dto: CreateEquipmentDto) {
    return this.service.createEquipment(dto);
  }

  @Patch(':id')
  @RequirePermissions('equipment.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEquipmentDto) {
    return this.service.updateEquipment(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('equipment.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeEquipment(id);
  }
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment.read')
  list(@Query() query: QueryVehiclesDto) {
    return this.service.listVehicles(query);
  }

  @Get(':id')
  @RequirePermissions('equipment.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getVehicle(id);
  }

  @Post()
  @RequirePermissions('equipment.write')
  create(@Body() dto: CreateVehicleDto) {
    return this.service.createVehicle(dto);
  }

  @Patch(':id')
  @RequirePermissions('equipment.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.service.updateVehicle(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('equipment.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeVehicle(id);
  }
}

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment.read')
  list(@Query() query: QueryMaintenanceDto) {
    return this.service.listMaintenance(query);
  }

  @Get(':id')
  @RequirePermissions('equipment.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getMaintenance(id);
  }

  @Post()
  @RequirePermissions('equipment.write')
  create(@Body() dto: CreateMaintenanceDto) {
    return this.service.createMaintenance(dto);
  }

  @Patch(':id')
  @RequirePermissions('equipment.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaintenanceDto) {
    return this.service.updateMaintenance(id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions('equipment.write')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.completeMaintenance(id);
  }

  @Delete(':id')
  @RequirePermissions('equipment.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeMaintenance(id);
  }
}

@Controller('assets')
export class AssetsController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment.read')
  list(@Query() query: QueryAssetsDto) {
    return this.service.listAssets(query);
  }

  @Get(':id')
  @RequirePermissions('equipment.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAsset(id);
  }

  @Post()
  @RequirePermissions('equipment.write')
  create(@Body() dto: CreateAssetDto) {
    return this.service.createAsset(dto);
  }

  @Patch(':id')
  @RequirePermissions('equipment.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAssetDto) {
    return this.service.updateAsset(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('equipment.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeAsset(id);
  }
}

@Controller('asset-assignments')
export class AssetAssignmentsController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  @RequirePermissions('equipment.read')
  list(@Query() query: QueryAssetAssignmentsDto) {
    return this.service.listAssignments(query);
  }

  @Get(':id')
  @RequirePermissions('equipment.read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAssignment(id);
  }

  @Post()
  @RequirePermissions('equipment.write')
  create(@Body() dto: CreateAssetAssignmentDto) {
    return this.service.createAssignment(dto);
  }

  @Post(':id/return')
  @RequirePermissions('equipment.write')
  return(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.returnAssignment(id);
  }

  @Delete(':id')
  @RequirePermissions('equipment.write')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.removeAssignment(id);
  }
}