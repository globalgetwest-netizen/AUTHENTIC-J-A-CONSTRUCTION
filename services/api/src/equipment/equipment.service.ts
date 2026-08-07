import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EquipmentStatus,
  MaintenanceStatus,
  Prisma,
  type Asset,
  type AssetAssignment,
  type Equipment,
  type MaintenanceRecord,
} from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildOrderBy,
  paginate,
  prismaSkipTake,
  type Paginated,
} from '../common/dto/pagination.dto';
import { generateBusinessCode } from '../common/utils/codegen';
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

const EQUIPMENT_SORTABLE = ['createdAt', 'name', 'assetCode', 'status', 'category', 'purchasePrice'] as const;
const EQUIPMENT_INCLUDE = {
  vehicle: {
    select: { id: true, registrationNo: true, licensePlate: true, fuelType: true },
  },
  _count: { select: { maintenance: true } },
} as const;

const VEHICLE_SORTABLE = ['createdAt', 'registrationNo', 'licensePlate', 'fuelType'] as const;
const VEHICLE_INCLUDE = {
  equipment: { select: { id: true, name: true, assetCode: true } },
} as const;

const MAINTENANCE_SORTABLE = ['scheduledAt', 'completedAt', 'cost', 'status', 'createdAt'] as const;
const MAINTENANCE_INCLUDE = {
  equipment: { select: { id: true, name: true, assetCode: true } },
} as const;

const ASSET_SORTABLE = ['createdAt', 'name', 'assetCode', 'status', 'category', 'currentValue'] as const;
const ASSET_COUNT = {
  _count: { select: { assignments: true } },
} as const;

const ASSIGNMENT_SORTABLE = ['assignedAt', 'returnedAt', 'createdAt'] as const;
const ASSIGNMENT_INCLUDE = {
  asset: { select: { id: true, name: true, assetCode: true } },
} as const;

/** Field that is empty when a string value is cleared. */
function asNullable(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value === '' ? null : value;
}

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Equipment ─────────────────────────────────────────────────────────────

  async listEquipments(query: QueryEquipmentsDto): Promise<Paginated<object>> {
    const where: Prisma.EquipmentWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { assetCode: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, EQUIPMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({ where, skip, take, orderBy, include: EQUIPMENT_INCLUDE }),
      this.prisma.equipment.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getEquipment(id: string): Promise<Equipment> {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, deletedAt: null },
      include: EQUIPMENT_INCLUDE,
    });
    if (!equipment) throw new NotFoundException(`Equipment ${id} not found`);
    return equipment;
  }

  async createEquipment(dto: CreateEquipmentDto): Promise<Equipment> {
    return this.prisma.equipment.create({
      data: {
        assetCode: generateBusinessCode('EQP'),
        name: dto.name,
        model: asNullable(dto.model),
        serialNo: asNullable(dto.serialNo),
        category: dto.category ?? 'GENERAL',
        status: dto.status ?? EquipmentStatus.AVAILABLE,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice ?? null,
        location: asNullable(dto.location),
        notes: asNullable(dto.notes),
      },
      include: EQUIPMENT_INCLUDE,
    });
  }

  async updateEquipment(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    await this.ensureEquipment(id);
    const data: Prisma.EquipmentUncheckedUpdateInput = {
      name: dto.name,
      model: asNullable(dto.model),
      serialNo: asNullable(dto.serialNo),
      category: dto.category,
      status: dto.status,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchasePrice: dto.purchasePrice,
      location: asNullable(dto.location),
      notes: asNullable(dto.notes),
    };
    return this.prisma.equipment.update({ where: { id }, data, include: EQUIPMENT_INCLUDE });
  }

  async removeEquipment(id: string): Promise<void> {
    const result = await this.prisma.equipment.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Equipment ${id} not found`);
  }

  private async ensureEquipment(id: string): Promise<void> {
    const exists = await this.prisma.equipment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Equipment ${id} not found`);
  }

  // ── Vehicles ───────────────────────────────────────────────────────────────

  async listVehicles(query: QueryVehiclesDto): Promise<Paginated<object>> {
    const where: Prisma.VehicleWhereInput = {};
    if (query.equipmentId) where.equipmentId = query.equipmentId;
    if (query.search) {
      where.OR = [
        { registrationNo: { contains: query.search, mode: 'insensitive' } },
        { licensePlate: { contains: query.search, mode: 'insensitive' } },
        { equipment: { is: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, VEHICLE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({ where, skip, take, orderBy, include: VEHICLE_INCLUDE }),
      this.prisma.vehicle.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getVehicle(id: string): Promise<object> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id },
      include: { ...VEHICLE_INCLUDE, fuelRecords: { orderBy: { fueledOn: 'desc' as const }, take: 20 } },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  /** Creates a vehicle for an equipment record (upsert on the unique equipmentId). */
  async createVehicle(dto: CreateVehicleDto): Promise<object> {
    await this.ensureEquipment(dto.equipmentId);
    const existing = await this.prisma.vehicle.findUnique({
      where: { equipmentId: dto.equipmentId },
      select: { id: true },
    });
    const data: Prisma.VehicleUncheckedCreateInput = {
      equipmentId: dto.equipmentId,
      registrationNo: dto.registrationNo,
      licensePlate: asNullable(dto.licensePlate),
      fuelType: asNullable(dto.fuelType),
      insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
      inspectionDue: dto.inspectionDue ? new Date(dto.inspectionDue) : null,
    };
    if (existing) {
      return this.prisma.vehicle.update({ where: { id: existing.id }, data: { ...data, equipmentId: undefined }, include: VEHICLE_INCLUDE });
    }
    return this.prisma.vehicle.create({ data, include: VEHICLE_INCLUDE });
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<object> {
    await this.ensureVehicle(id);
    const data: Prisma.VehicleUncheckedUpdateInput = {
      registrationNo: dto.registrationNo,
      licensePlate: asNullable(dto.licensePlate),
      fuelType: asNullable(dto.fuelType),
      insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
      inspectionDue: dto.inspectionDue ? new Date(dto.inspectionDue) : null,
    };
    return this.prisma.vehicle.update({ where: { id }, data, include: VEHICLE_INCLUDE });
  }

  async removeVehicle(id: string): Promise<void> {
    const result = await this.prisma.vehicle.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Vehicle ${id} not found`);
  }

  private async ensureVehicle(id: string): Promise<void> {
    const exists = await this.prisma.vehicle.findFirst({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException(`Vehicle ${id} not found`);
  }

  // ── Maintenance ────────────────────────────────────────────────────────────

  async listMaintenance(query: QueryMaintenanceDto): Promise<Paginated<object>> {
    const where: Prisma.MaintenanceRecordWhereInput = {};
    if (query.equipmentId) where.equipmentId = query.equipmentId;
    if (query.status) where.status = query.status;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, MAINTENANCE_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({ where, skip, take, orderBy, include: MAINTENANCE_INCLUDE }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getMaintenance(id: string): Promise<MaintenanceRecord> {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id },
      include: MAINTENANCE_INCLUDE,
    });
    if (!record) throw new NotFoundException(`Maintenance record ${id} not found`);
    return record;
  }

  async createMaintenance(dto: CreateMaintenanceDto): Promise<MaintenanceRecord> {
    await this.ensureEquipment(dto.equipmentId);
    return this.prisma.maintenanceRecord.create({
      data: {
        equipmentId: dto.equipmentId,
        scheduledAt: new Date(dto.scheduledAt),
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        cost: dto.cost ?? null,
        serviceProvider: asNullable(dto.serviceProvider),
        description: asNullable(dto.description),
        status: dto.status ?? MaintenanceStatus.SCHEDULED,
      },
      include: MAINTENANCE_INCLUDE,
    });
  }

  async updateMaintenance(id: string, dto: UpdateMaintenanceDto): Promise<MaintenanceRecord> {
    await this.ensureMaintenance(id);
    const data: Prisma.MaintenanceRecordUncheckedUpdateInput = {
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      cost: dto.cost,
      serviceProvider: asNullable(dto.serviceProvider),
      description: asNullable(dto.description),
      status: dto.status,
    };
    return this.prisma.maintenanceRecord.update({ where: { id }, data, include: MAINTENANCE_INCLUDE });
  }

  async removeMaintenance(id: string): Promise<void> {
    const result = await this.prisma.maintenanceRecord.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Maintenance record ${id} not found`);
  }

  async completeMaintenance(id: string): Promise<MaintenanceRecord> {
    await this.ensureMaintenance(id);
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { status: MaintenanceStatus.COMPLETED, completedAt: new Date() },
      include: MAINTENANCE_INCLUDE,
    });
  }

  private async ensureMaintenance(id: string): Promise<void> {
    const exists = await this.prisma.maintenanceRecord.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Maintenance record ${id} not found`);
  }

  // ── Assets (non-equipment assets) ──────────────────────────────────────────

  async listAssets(query: QueryAssetsDto): Promise<Paginated<object>> {
    const where: Prisma.AssetWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { assetCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, ASSET_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({ where, skip, take, orderBy, include: ASSET_COUNT }),
      this.prisma.asset.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getAsset(id: string): Promise<Asset> {
    const asset = await this.prisma.asset.findFirst({ where: { id, deletedAt: null }, include: ASSET_COUNT });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  async createAsset(dto: CreateAssetDto): Promise<Asset> {
    return this.prisma.asset.create({
      data: {
        assetCode: generateBusinessCode('AST'),
        name: dto.name,
        category: dto.category ?? 'GENERAL',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice ?? null,
        currentValue: dto.currentValue ?? null,
        location: asNullable(dto.location),
        status: dto.status ?? 'ACTIVE',
        notes: asNullable(dto.notes),
      },
      include: ASSET_COUNT,
    });
  }

  async updateAsset(id: string, dto: UpdateAssetDto): Promise<Asset> {
    await this.ensureAsset(id);
    const data: Prisma.AssetUncheckedUpdateInput = {
      name: dto.name,
      category: dto.category,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      purchasePrice: dto.purchasePrice,
      currentValue: dto.currentValue,
      location: asNullable(dto.location),
      status: dto.status,
      notes: asNullable(dto.notes),
    };
    return this.prisma.asset.update({ where: { id }, data, include: ASSET_COUNT });
  }

  async removeAsset(id: string): Promise<void> {
    const result = await this.prisma.asset.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Asset ${id} not found`);
  }

  private async ensureAsset(id: string): Promise<void> {
    const exists = await this.prisma.asset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Asset ${id} not found`);
  }

  // ── Asset assignments ──────────────────────────────────────────────────────

  async listAssignments(query: QueryAssetAssignmentsDto): Promise<Paginated<object>> {
    const where: Prisma.AssetAssignmentWhereInput = {};
    if (query.assetId) where.assetId = query.assetId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.activeOnly) where.returnedAt = null;
    const { skip, take } = prismaSkipTake(query);
    const orderBy = buildOrderBy(query.sortBy, query.sortOrder, ASSIGNMENT_SORTABLE);
    const [data, total] = await Promise.all([
      this.prisma.assetAssignment.findMany({ where, skip, take, orderBy, include: ASSIGNMENT_INCLUDE }),
      this.prisma.assetAssignment.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async getAssignment(id: string): Promise<AssetAssignment> {
    const assignment = await this.prisma.assetAssignment.findFirst({
      where: { id },
      include: ASSIGNMENT_INCLUDE,
    });
    if (!assignment) throw new NotFoundException(`Asset assignment ${id} not found`);
    return assignment;
  }

  async createAssignment(dto: CreateAssetAssignmentDto): Promise<AssetAssignment> {
    const asset = await this.prisma.asset.findFirst({
      where: { id: dto.assetId, deletedAt: null },
      select: { id: true },
    });
    if (!asset) throw new NotFoundException(`Asset ${dto.assetId} not found`);
    return this.prisma.assetAssignment.create({
      data: {
        assetId: dto.assetId,
        assignedToId: dto.assignedToId,
        assignedById: dto.assignedById ?? null,
        notes: asNullable(dto.notes),
        assignedAt: new Date(),
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  /** Marks an assignment returned (`returnedAt` now). */
  async returnAssignment(id: string): Promise<AssetAssignment> {
    await this.ensureAssignment(id);
    return this.prisma.assetAssignment.update({
      where: { id },
      data: { returnedAt: new Date() },
      include: ASSIGNMENT_INCLUDE,
    });
  }

  async removeAssignment(id: string): Promise<void> {
    const result = await this.prisma.assetAssignment.deleteMany({ where: { id } });
    if (result.count === 0) throw new NotFoundException(`Asset assignment ${id} not found`);
  }

  private async ensureAssignment(id: string): Promise<void> {
    const exists = await this.prisma.assetAssignment.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Asset assignment ${id} not found`);
  }
}