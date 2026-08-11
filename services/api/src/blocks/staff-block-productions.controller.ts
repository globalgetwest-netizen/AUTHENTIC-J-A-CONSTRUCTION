import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user.type';
import { requireDepartmentCode, resolveStaffContext } from '../common/staff/staff-context';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from './blocks.service';
import { CreateBlockProductionDto } from './dto/create-block-production.dto';
import { QueryBlockProductionsDto, QueryBlockProductsDto } from './dto/query-blocks.dto';

/**
 * Staff portal — Block factory production. Authenticated-only. Recording a
 * batch requires the Block Production department; viewing is scoped to the
 * caller's own batches (or the whole floor for the Block Production head).
 */
@Controller('staff/block-productions')
export class StaffBlockProductionsController {
  constructor(
    private readonly blocks: BlocksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryBlockProductionsDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    return this.blocks.listProductionsForStaff(ctx, query);
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBlockProductionDto) {
    const ctx = await resolveStaffContext(this.prisma, user.id);
    requireDepartmentCode(ctx, 'DPT-BLOCKFACTORY');
    return this.blocks.createStaffProduction(ctx, dto);
  }
}

/** Shared block-product catalogue — read by any staff member for production forms. */
@Controller('staff/block-products')
export class StaffBlockProductsController {
  constructor(
    private readonly blocks: BlocksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: QueryBlockProductsDto) {
    await resolveStaffContext(this.prisma, user.id);
    return this.blocks.listProducts(query);
  }
}
