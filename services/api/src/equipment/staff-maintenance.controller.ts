import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { requireDepartmentCode, resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentService } from './equipment.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { QueryMaintenanceDto } from './dto/maintenance-query.dto';
import { QueryEquipmentsDto } from './dto/equipment-query.dto';

/**
 * Staff portal — Plant & Equipment maintenance. Authenticated-only. Logging a
 * maintenance job requires the Plant department; viewing is scoped to the
 * caller's own jobs (or the whole worklist for the Plant head).
 */
@Controller('staff/maintenance')
export class StaffMaintenanceController {
  constructor(
    private readonly equipment: EquipmentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryMaintenanceDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.equipment.listMaintenanceForStaff(ctx, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateMaintenanceDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-PLANT');
    return this.equipment.createStaffMaintenance(ctx, dto);
  }
}

/** Shared equipment catalogue — read by any staff member for maintenance forms. */
@Controller('staff/equipment')
export class StaffEquipmentController {
  constructor(
    private readonly equipment: EquipmentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryEquipmentsDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.equipment.listEquipments(query);
  }
}
