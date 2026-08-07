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
import type { Quotation } from '@ajac/database';
import type { Paginated } from '../common/dto/pagination.dto';
import { RequirePermissions } from '../common/auth/require-permissions.decorator';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationsDto } from './dto/query-quotations.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @RequirePermissions('quotations.read')
  list(@Query() query: QueryQuotationsDto): Promise<Paginated<Quotation>> {
    return this.quotationsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('quotations.read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Quotation> {
    return this.quotationsService.get(id);
  }

  @Post()
  @RequirePermissions('quotations.write')
  create(@Body() dto: CreateQuotationDto): Promise<Quotation> {
    return this.quotationsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('quotations.write')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationDto): Promise<Quotation> {
    return this.quotationsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('quotations.write')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.quotationsService.remove(id);
  }
}
