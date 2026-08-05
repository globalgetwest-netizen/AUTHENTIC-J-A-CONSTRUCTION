import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Lead } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions('leads.read')
  list(@Query() query: QueryLeadsDto): Promise<Paginated<Lead>> {
    return this.leadsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('leads.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Lead> {
    return this.leadsService.get(id);
  }

  @Post()
  @RequirePermissions('leads.write')
  create(@Body() dto: CreateLeadDto): Promise<Lead> {
    return this.leadsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('leads.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto): Promise<Lead> {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('leads.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.leadsService.remove(id);
  }
}
